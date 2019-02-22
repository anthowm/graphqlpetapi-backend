
const { gql } = require('apollo-server-express');

module.exports = {
    petTypeDef: gql`
    extend type Query {
        pets(page: Int, name: String, type: String): PetData!
        pet(id: ID!): Pet!
    }
    
    extend type Mutation{
        createPet(petInput: PetInputData): Pet!
        updatePet(id: ID!, petInput: PetInputDataUpdate): Pet!
        deletePet(id: ID!): Boolean
    }

    type Pet {
        id: ID!
        name: String!
        type: String!
        imageUrls: [File!]!
        creator: UserPet!
        createdAt: String!
        updatedAt: String!
    }

    type PetData {
        pets: [Pet!]!
        totalPets: Int!
        filterData: FilterDataPet!
    }

    type File {
        id: String!
        path: String!
        filename: String!
        mimetype: String!
    }

    type UserPet {
        id: ID!
        name: String!
        email: String!
        pets: [Pet!]!
    }

    type FilterDataPet {
        isFilterData: Boolean!
        currentPage: Int!
        queryParams: QueryParamsPet
    }

    type QueryParamsPet {
        name: String
        type: String
    }

    input PetInputData {
        name: String!
        type: String!
        imageUrls: [Upload!]!
    }

    input PetInputDataUpdate {
        name: String!
        type: String!
        imageUrls: [Upload]
    }
    `
}