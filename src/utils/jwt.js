const jwt = require('jsonwebtoken');
require('dotenv').config(); 

const secret = process.env.SECRETKEY;
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, },
        secret,
        { expiresIn: '365d' }
    );
};

module.exports = { generateToken };

