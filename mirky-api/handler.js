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

// Require routes
const baseRoute = require("./routes/baseRoute");
const authRoutes = require("./routes/auth");
const propertiesRoutes = require("./routes/properties");

// Define Routes
// Base route
app.get('/', baseRoute.home)

// Auth routes
// Anon session
app.post('/auth/anonSession', authRoutes.anonSession);

// Signup
app.post('/auth/signup', authRoutes.signup);

// Login
app.post('/auth/login', authRoutes.login);

// Properties routes
// create property
app.post('/property/create', propertiesRoutes.create);

// fetch properties by uid
// TODO: change to get request, and change logic in route
app.post('/property/fetch-users-props', propertiesRoutes.fetchByUid);

// Define error handlers
app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

// Export app to serverless
module.exports.handler = serverless(app);
