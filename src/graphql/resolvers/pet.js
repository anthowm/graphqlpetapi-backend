
const { notAuthenticated } = require('../../helpers/not-authenticated');
const User = require('../../models/user');
const validator = require('validator');
const utils = require('../../helpers/validator-messages');
const Pet = require('../../models/pet');
const { clearImage } = require('../../util/file');
const { ApolloError } = require('apollo-server-express');
const mkdirp = require('mkdirp');
const fs = require('fs');
const shortid = require('shortid');
const UPLOAD_DIR = './images';
mkdirp.sync(UPLOAD_DIR);
module.exports = {
    Query: {
        pets: async (parent, { page, name, type }, { req }) => {
            notAuthenticated(req);
            if (!page) {
                page = 1;
            }
            const perPage = 8;
            let filter = {};
            let queryParams = {};
            if (name) {
                filter.name = { '$regex': name, '$options': 'i' };
                queryParams.name = name;
            }
            if (type) {
                filter.type = { '$regex': type, '$options': 'i' };
                queryParams.type = type;
            }
            const totalPets = await Pet.find(filter).countDocuments();
            const pets = await Pet.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .populate('creator');
            return {
                pets: pets.map((pet) => {
                    return {
                        ...pet._doc,
                        id: pet._id.toString(),
                        createdAt: pet.createdAt.toISOString(),
                        updateAt: pet.updatedAt.toISOString()
                    }
                }),
                totalPets: totalPets,
                filterData: {
                    isFilterData: Object.getOwnPropertyNames(filter).length > 0 ? true : false,
                    currentPage: page,
                    queryParams: Object.getOwnPropertyNames(filter).length > 0 ? queryParams : null
                }
            };
        },
        pet: async (parent, { id }, { req }) => {
            notAuthenticated(req);
            const pet = await Pet.findById(id).populate('creator');
            petNotFound(pet);
            return petFormat(pet);
        }
    },
    Mutation: {
        createPet: async (parent, { petInput }, { req }) => {
            notAuthenticated(req);
            const user = await User.findById(req.userId);
            if (!user) {
                throw new ApolloError('Invalid user.', '401');
            }
            const imagesUploaded = await Promise.all(
                petInput.imageUrls.map(processUpload)
            );
            validationPet(petInput, imagesUploaded);
            const pet = new Pet({
                name: petInput.name,
                type: petInput.type,
                imageUrls: imagesUploaded,
                creator: user
            });
            const createdPet = await pet.save();
            user.pets.push(createdPet);
            const userSaved = await user.save();
            const returnPet = {
                ...createdPet._doc,
                id: createdPet._id.toString(),
                creator: {
                    name: createdPet.creator.name,
                    email: createdPet.creator.email
                },
                createdAt: createdPet.createdAt.toISOString(),
                updateAt: createdPet.updatedAt.toISOString()
            }
            return returnPet;
        },
        updatePet: async (parent, { id, petInput }, { req }) => {
            notAuthenticated(req);
            const pet = await Pet.findById(id).populate('creator');
            petNotFound(pet);
            if (pet.creator._id.toString() !== req.userId.toString()) {
                throw new ApolloError('Not authorized!.', '403');
            }

            pet.name = petInput.name;
            pet.type = petInput.type;
            let imagesUploaded;
            if (petInput.imageUrls) {
                pet.imageUrls.map((element) => {
                    clearImage(element.path);
                });
                imagesUploaded = await Promise.all(
                    petInput.imageUrls.map(processUpload)
                );
                pet.imageUrls = imagesUploaded;
            } else {
                imagesUploaded = null;
            }
            validationPet(petInput, imagesUploaded);
            const updatedPet = await pet.save();
            const returnPet = {
                ...updatedPet._doc,
                id: updatedPet._id.toString(),
                creator: {
                    name: updatedPet.creator.name,
                    email: updatedPet.creator.email
                },
                createdAt: updatedPet.createdAt.toISOString(),
                updateAt: updatedPet.updatedAt.toISOString()
            }
            return returnPet;
        },
        deletePet: async (parent, { id }, { req }) => {
            notAuthenticated(req);
            const pet = await Pet.findById(id);
            petNotFound(pet);
            if (pet.creator.toString() !== req.userId.toString()) {
                throw new ApolloError('Not authorized!.', '403');
            }
            pet.imageUrls.map((element) => {
                clearImage(element.path);
            });
            await Pet.findByIdAndRemove(id);
            const user = await User.findById(req.userId);
            user.pets.pull(id);
            await user.save();
            return true;

        }
    }
};

function petNotFound(pet) {
    if (!pet) {
        throw new ApolloError('No pet found!.', '404');
    }
}

function validationPet(petInput, imagesUploaded) {
    const errors = [];
    if (validator.isEmpty(petInput.name) ||
        !validator.isLength(petInput.name, { min: 3, max: 20 })) {
        errors.push(utils.lengthBetween('Name', '3', '20'));
    }
    if (imagesUploaded) {
        if (!imagesUploaded.every((element) => {
            return fileFilter(element);
        })) {
            imagesUploaded.map((element) => {
                clearImage(element.path);
            })
            errors.push(`Files must be jpg, jpeg or png`);
        }
    }
    if (validator.isEmpty(petInput.type) ||
        !validator.isLength(petInput.type, { min: 2, max: 20 })) {
        errors.push(utils.lengthBetween('Type', '2', '20'));
    }
    if (errors.length > 0) {
        throw new ApolloError('Invalid input.', '422', {
            invalidArgs: errors,
        });
    }
}

function petFormat(createdPet) {
    return {
        ...createdPet._doc,
        id: createdPet._id.toString(),
        createdAt: createdPet.createdAt.toISOString(),
        updateAt: createdPet.updatedAt.toISOString()
    };
}



const storeFS = ({ stream, filename, mimetype }) => {
    const id = shortid.generate();
    filename = `${id}-${filename}`
    const path = `${UPLOAD_DIR}/${filename}`;
    return new Promise((resolve, reject) =>
        stream
            .on('error', error => {
                if (stream.truncated)
                    // Delete the truncated file.
                    fs.unlinkSync(path);
                reject(error)
            })
            .pipe(fs.createWriteStream(path))
            .on('error', error => {
                reject(error)
            })
            .on('finish', () => resolve({ id, filename, path, mimetype }))
    );
}

const processUpload = async upload => {
    const { createReadStream, filename, mimetype } = await upload;
    const stream = createReadStream();
    return storeFS({ stream, filename, mimetype });
}

const fileFilter = (file) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        return true;
    } else {
        return false;
    }
};



