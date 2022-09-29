const serverless = require("serverless-http");
const express = require("express");
const app = express();
const { connectDb } = require("./utils/db");

const db = connectDb();

app.get("/", (req, res, next) => {
  const data = db.collection("test").find({}).toArray();
  return res.status(200).json({
    message: "poop",
    data
  });
});

app.get("/v2", (req, res, next) => {
  return res.status(200).json({
    message: "lmao",
  });
});

app.get("/hello", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from path!",
  });
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

// app.listen(8080, () => {
//   console.log("Server is running on port 8080");
// });

module.exports.handler = serverless(app);
