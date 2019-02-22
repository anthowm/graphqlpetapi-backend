const { ApolloError } = require('apollo-server-express');

module.exports = {
    notAuthenticated: (req) => {
        if (!req.isAuth) {
            throw new ApolloError('You must be logged in.', '401');
        }
    }
};