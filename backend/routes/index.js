// Import the express module 
const express = require('express');
// Import the router module 
const router = express.Router();
// // Import the install router 
const installRouter = require('./install.routes');
// // Import the employee routes 
// const employeeRouter = require('./employee.routes');
// // Import the customer routes 
// const customerRouter = require('./customer.routes');
// // Import the login routes 
// const loginRoutes = require("./login.routes");
// // Import the service routes 
// const serviceRoutes = require("./service.routes");
// // Add the install router to the middleware chain
// router.use(installRouter);
// // Add the employee routes to the main router 
// router.use(employeeRouter);
// // Add the customer routes to the main router 
// router.use(customerRouter);
// // Add the login routes to the main router
// router.use(loginRoutes);
// // Add the service routes to the main router
// router.use(serviceRoutes);
// Export the router
module.exports = router;