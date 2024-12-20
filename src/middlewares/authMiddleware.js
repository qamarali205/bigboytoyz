require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const secret = process.env.SECRETKEY;

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization") && req.header("Authorization").replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = {
      id: user?._id,
      userEmail:user?.userEmail,
      userName:user?.userName        
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }

    // Token verification failed
    res.status(401).json({ message: "Token is not valid", error: err.message });
  }
};

module.exports = authMiddleware;
