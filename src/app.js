// Imports
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
// Path import
const path = require('path');
// database connect
const mongoConnect = require('./util/database');
// graphql imports
const { ApolloServer } = require('apollo-server-express');
const resolvers = require('./graphql/resolvers/index');
const schema = require('./graphql/schema/index');
// auth
const auth = require('./middlewares/auth-middleware');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
// express
const app = express();
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));
app.disable('x-powered-by');

app.use(bodyParser.json());



app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use('/images', express.static(path.join(__dirname, '../images')));

app.use(auth);

const server = new ApolloServer({
    // These will be defined for both new or existing servers
    introspection: true,
    typeDefs: schema,
    resolvers,
    playground: true,
    context: ({ req }) => {
        return { req };
    },
    uploads: {
        maxFileSize: 10000000, // 10 MB
        maxFiles: 5
    }
});

server.applyMiddleware({ app: app }); // app is from an existing express app

app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);

mongoConnect(client => {
    app.listen(process.env.PORT | 8080);
});



