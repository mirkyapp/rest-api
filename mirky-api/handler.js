const express = require('express');
const serverless = require("serverless-http");
var bodyParser = require('body-parser')

// Set up app
const app = express();

// Middleware
app.use(bodyParser.json());
var cors = require('cors');
app.use(cors());

// Require utils
const { connectDb } = require('./utils/db');
const { decrypt } = require('./utils/decrypt');

// Require routes
const baseRoute = require("./routes/baseRoute");
const authRoutes = require("./routes/auth");
const propertiesRoutes = require("./routes/properties");
const userRoutes = require("./routes/user");
const { upload } = require('./utils/upload');

// db
const db = connectDb();

// Auth middleware
app.use(async function(req, res, next) {
  if (req.url == "/auth/anon-session" || req.url == "/") {
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
app.get('/', baseRoute.home)

// Auth routes
// Anon session
app.post('/auth/anon-session', authRoutes.anonSession);

// Signup
app.post('/auth/signup', authRoutes.signup);

// Login
app.post('/auth/login', authRoutes.login);

// Properties routes
// create property
app.post('/property/create', propertiesRoutes.create);

// fetch properties by uid
// TODO: change to get request, and change logic in route
app.get('/property/fetch-users-props/:uid', propertiesRoutes.fetchByUid);

// User routes
// fetch user by uid
app.get('/user/:uid', userRoutes.fetchByUid);

// update profile picture
app.post('/user/:uid/update/profile-picture', userRoutes.updateProfilePicture);

// update variable user fields
app.post('/user/:uid/update/:field', userRoutes.updateField);

// Define error handlers
app.use((req, res, next) => {
  return res.status(404).json({
    error: "Route Not Found",
  });
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

// Export app to serverless
module.exports.handler = serverless(app);
