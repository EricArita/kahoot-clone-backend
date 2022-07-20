require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginController = async (req, res) => {
  const user = await User.findOne({ userName: req.body.userName });
  if (user == null) {
    return res.status(400).send("Cannot find user");
  }

  try {
    if (req.body.password === 'demo@123') {
      const accessToken = generateAccessToken({
        userName: user.userName,
        id: user._id,
      });
  
      const refreshToken = generateRefreshToken({
        userName: user.userName,
        id: user._id,
      });
  
      res.status(200).json({
        result: user,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } else {
      res.send("Not allowed");
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerController = async (req, res) => {
  const {
    userType,
    firstName,
    lastName,
    userName,
    mail,
    password,
    confirmPassword,
  } = req.body;
  const existingEmail = await User.findOne({ mail });
  const existingUserName = await User.findOne({ userName });

  if (existingEmail || existingUserName) {
    return res.status(400).json({ message: "User already exists." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords don't match" });
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    userType,
    firstName,
    lastName,
    userName,
    mail,
    password: hashedPassword,
  });

  try {
    const newUser = await user.save();
    
    const accessToken = generateAccessToken({
      userName: user.userName,
      id: user._id,
    });

    const refreshToken = generateRefreshToken({
      userName: user.userName,
      id: user._id,
    });

    res.status(201).json({
      result: newUser,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const generateAccessToken = (userData) => {
  return jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
};

const generateRefreshToken = (userData) => {
  return jwt.sign(
    userData,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "2h" }
  );
}

module.exports = { loginController, registerController };
