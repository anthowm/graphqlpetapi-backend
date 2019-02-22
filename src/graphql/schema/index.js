const { gql } = require('apollo-server-express');
const { petTypeDef } = require('./pet');
const { userTypeDef } = require('./user');
const rootSchema = gql`
type Query {
    _: Boolean
  }
  type Mutation {
    _: Boolean
  }
  type Subscription {
    _: Boolean
  }
`;

module.exports = [rootSchema, userTypeDef, petTypeDef];
