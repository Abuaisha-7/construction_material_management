// Import the dotenv module and call the config() method 
const dotenv = require("dotenv").config();
// Import the express module
const express = require("express");
// Import the sanitizer module 
const sanitize = require('sanitize');
// Import the cors module
const cors = require("cors");
// Set up the CORS options to allow requests from our front-end 
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    optionsSuccessStatus: 200
  };
// Create an instance of express
const app = express();
// Use the express.json() middleware to parse the request body
app.use(express.json());
// Add the sanitizer to the express middleware 
app.use(sanitize.middleware);
// Allow CORS to all
app.use(cors(corsOptions));
// Import the routes
const routes = require('./routes');
// Add the routes to the middleware chain
app.use(routes);
// Get the port from the environment variable 
const port = process.env.PORT;
// Set up the listener
app.listen(port, () => console.log(`Listening on port ${port}`));
