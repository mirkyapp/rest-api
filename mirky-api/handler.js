const express = require('express');
const serverless = require("serverless-http");
var bodyParser = require('body-parser')
var http = require('http');
const { Server } = require("socket.io");

// Set up app
const app = express();
var server = http.createServer(app);

// Middleware
app.use(bodyParser.json());
var cors = require('cors');
app.use(cors());

// Set up socket
const io = new Server(server, {
  cors: {
    origin: '*',
  }

});
exports.io = io;

// Require utils
const { connectDb } = require('./utils/db');
const { decrypt } = require('./utils/decrypt');
const { upload } = require('./utils/upload');

// Require routes
const baseRoute = require("./routes/baseRoute");
const authRoutes = require("./routes/auth");
const propertiesRoutes = require("./routes/properties");
const userRoutes = require("./routes/user");
const analyticsRoutes = require("./routes/analytics");

// db
const db = connectDb();

// Auth middleware
app.use(async function(req, res, next) {
  if (req.url == "/v1/auth/anon-session" || req.url == "/" || req.url.includes('/v1/analytics') || req.url.includes('/socket.io')) {
    next();
  } else {

    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials.' });
    }
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [sessionId, password] = Buffer.from(b64auth, 'base64').toString().split(':')
    // Validate session
    var session = await db.collection('sessions').findOne({
      sessionId: sessionId
    });

    if (!session) {
      return res.status(403).json({
        error: 'Invalid session id'
      });
    }
    if (decrypt(session.sessionPass, process.env.MASTER_ENCRYPT_KEY) !== decrypt(password, process.env.MASTER_ENCRYPT_KEY)) {
      return res.status(403).json({
        error: 'Invalid session password'
      });
    }

    next();
  }
});


// Define Routes
// Base route
app.get('/', baseRoute.home);

// Auth routes
// Anon session
app.post('/v1/auth/anon-session', authRoutes.anonSession);

// Signup
app.post('/v1/auth/signup', authRoutes.signup);

// Login
app.post('/v1/auth/login', authRoutes.login);

// Properties routes
// create property
app.post('/v1/property/create', propertiesRoutes.create);

// fetch properties by uid
// TODO: change to get request, and change logic in route
app.get('/v1/property/fetch-users-props/:uid', propertiesRoutes.fetchByUid);

// fetch property by propId
app.get('/v1/property/fetch-prop/:propId', propertiesRoutes.fetchByPropId);

// update property logo
app.post('/v1/property/:propId/update/logo', propertiesRoutes.updateLogo);

// User routes
// fetch user by uid
app.get('/v1/user/:uid', userRoutes.fetchByUid);

// update profile picture
app.post('/v1/user/:uid/update/profile-picture', userRoutes.updateProfilePicture);

// update variable user fields
app.post('/v1/user/:uid/update/:field', userRoutes.updateField);

// Analytics routes
// Verify prop id
app.get('/v1/analytics/:propId/verify', analyticsRoutes.verifyPropId);

// Handle page view events
app.post('/v1/analytics/:propId/page-view', analyticsRoutes.pageView);

// export the websocket handlers
// Connect
module.exports.connectHandler = analyticsRoutes.connectHandler;

// Disconnect
module.exports.disconnectHandler = analyticsRoutes.disconnectHandler;

// Define error handlers
app.use((req, res, next) => {
  return res.status(404).json({
    error: "Route Not Found",
  });
});

// listen on port 8080
server.listen(8080, () => {
  console.log('listening on *:8080');
});

// Export app to serverless
module.exports.handler = serverless(app);