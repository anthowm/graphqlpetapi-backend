
const { gql } = require('apollo-server-express');

module.exports = {
    userTypeDef: gql`
    extend type Query {
        login(email: String!, password: String!): AuthData!
        user: User!
    }

    extend type Mutation{
        createUser(userInput: UserInputData): User!
    }

    type User {
        id: ID!
        name: String!
        email: String!
        password: String!
        status: String!
        pets: [Pet!]!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }
    `
}