// middleware/verifyToken.js
const jwt = require('jsonwebtoken');
const Auth = require('../models/authModel'); // Import the Auth model

exports.verifyToken = async (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    console.log('No token provided.');
    return res.status(401).send('Access Denied. No Token Provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Check tokenVersion by fetching the admin from DB
    const admin = await Auth.findById(decoded.adminId);
    if (!admin || admin.tokenVersion !== decoded.tokenVersion) {
      console.log('Invalid token: token version mismatch');
      return res.status(401).send('Invalid Token.');
    }
    req.adminId = decoded.adminId;
    console.log('Admin ID from token:', req.adminId);
    next();
  } catch (err) {
    console.log('Invalid Token:', err.message);
    return res.status(400).send('Invalid Token.');
  }
};
