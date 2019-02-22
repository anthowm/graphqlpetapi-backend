
const User = require('../../models/user');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const utils = require('../../helpers/validator-messages');
const { notAuthenticated } = require('../../helpers/not-authenticated');
const { ApolloError } = require('apollo-server-express');
module.exports = {
    Query: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email: email });
            if (!user) {
                throw new ApolloError('User not found.', '401');
            }
            const isEqual = await bcrypt.compare(password, user.password);
            if (!isEqual) {
                throw new ApolloError('Password is incorrect.', '401');
            }
            const token = jwt.sign(
                {
                    userId: user._id.toString(),
                    email: user.email
                },
                'somesupersecretsecret',
                { expiresIn: '1h' }
            );
            return { token: token, userId: user._id.toString() };
        },
        user: async (parent, args, { req }) => {
            notAuthenticated(req);
            const user = await User.findById(req.userId);
            if (!user) {
                throw new ApolloError('No user found!.', '404');
            }
            return { ...user._doc, id: user._id.toString() };
        }
    },
    Mutation: {
        createUser: async (parent, { userInput }) => {
            const errors = [];
            if (validator.isEmpty(userInput.name) ||
                !validator.isLength(userInput.name, { min: 3, max: 20 })) {
                errors.push(utils.lengthBetween('Name', '3', '20'));
            }
            if (!validator.isEmail(userInput.email)) {
                errors.push('Email is invalid.');
            }
            if (
                validator.isEmpty(userInput.password) ||
                !validator.isLength(userInput.password, { min: 8, max: 20 })
            ) {
                errors.push(utils.lengthBetween('Password', '8', '20'));
            }
            if (errors.length > 0) {
                throw new ApolloError('Invalid input.', '422', {
                    invalidArgs: errors,
                });
            }
            const existingUser = await User.findOne(
                {
                    email: userInput.email
                }
            );
            if (existingUser) {
                throw new ApolloError('User already exists.', '400');
            }
            const hashedPassword = await bcrypt.hash(userInput.password, 12);
            const user = new User({
                email: userInput.email,
                name: userInput.name,
                password: hashedPassword
            });
            const createdUser = await user.save();
            return { ...createdUser._doc, id: createdUser._id.toString() }
        }
    }
};