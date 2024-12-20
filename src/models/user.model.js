const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z]+$/, // Only allows lowercase letters, numbers, and underscores
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z]+$/, // Only allows lowercase letters, numbers, and underscores
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true, // Ensures email is unique
      match: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/, // Validates email format
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      // match:/^[a-z0-9]+$/
    },
    mobileNumber: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 15,
    },
    otpCode: {
      type: String,
      default: null, // Can be null when OTP is not in use
    },
    otpExpiry: {
      type: Date,
      default: null, // Can be null when OTP is not in use
    },
    boi: {
      type: String,
      default:null
    }    
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;