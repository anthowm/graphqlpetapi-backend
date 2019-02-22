const mongoose = require('mongoose');

const mongoConnect = (callback) => {
    mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-gurab.mongodb.net/${process.env.MONGO_DATABASE_DEFAULT}?retryWrites=true`, { useNewUrlParser: true })
        .then(
            client => {
                callback(client);
            }
        ).catch(err => {
        });
};

module.exports = mongoConnect;
