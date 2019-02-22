const userResolver = require('./user');
const petResolver = require('./pet');
const rootResolver = [userResolver, petResolver];
module.exports = rootResolver;