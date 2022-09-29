const express = require('express');
const serverless = require("serverless-http");

// Set up app
const app = express();

// Require utils

// Require routes
const baseRoute = require("./routes/baseRoute");

// Define Routes
app.get('/', baseRoute.home)

// Define error handlers
app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

// app.listen(8080, () => {
//   console.log("Server is running on port 8080");
// });

// Export app to serverless
module.exports.handler = serverless(app);
