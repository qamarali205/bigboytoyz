const express = require("express");

const userRoutes = require('./user.routes');


const router = express.Router();


// Use the user routes

router.use('/users', userRoutes);

module.exports = router;

