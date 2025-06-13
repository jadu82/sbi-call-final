// controllers/authController.js
const Auth = require('../models/authModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.getLogin = (req, res) => {
  res.render('index');  // Render login page
};

exports.login = async (req, res) => {
  const { username, password } = req.body; 

  try {
    const admin = await Auth.findOne({ username });
    if (!admin) {
      return res.status(400).render('index', { errorMessage: 'Admin not found!' });
    }

    if (password !== admin.password) {
      return res.status(400).render('index', { errorMessage: 'Invalid credentials!' });
    }

    // Include tokenVersion in the payload
    const token = jwt.sign(
      { adminId: admin._id, tokenVersion: admin.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set cookie for 1 hour
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour in milliseconds
    });

    res.redirect('/api/device/dashboard');
  } catch (err) {
    res.status(500).render('index', { errorMessage: 'Server error. Please try again!' });
  }
};

exports.getChangeCredentials = (req, res) => {
  res.render('change', { message: '' });
};

exports.changeCredentials = async (req, res) => {
  const { oldPassword, newUsername, newPassword } = req.body;
  const adminId = req.adminId; 

  try {
    const admin = await Auth.findById(adminId);
    if (!admin) {
      return res.status(400).send('Admin not found!');
    }

    if (oldPassword !== admin.password) {
      return res.render('change', { message: 'Old password is incorrect' });
    }

    if (newPassword) {
      admin.password = newPassword;
    }
    if (newUsername) {
      admin.username = newUsername;
    }

    await admin.save();
    res.render('change', { message: 'Credentials updated successfully' });
  } catch (err) {
    res.render('change', { message: 'Server error, please try again later' });
  }
};

exports.logoutAll = async (req, res) => {
  const adminId = req.adminId;
  try {
    const admin = await Auth.findById(adminId);
    if (!admin) return res.status(404).send("Admin not found");

    // Invalidate all tokens by incrementing tokenVersion
    admin.tokenVersion += 1;
    await admin.save();

    console.log(`Admin with id ${adminId} logged out from all devices. New tokenVersion: ${admin.tokenVersion}`);
    // Clear the auth cookie
    res.clearCookie("authToken");
    res.send("Logged out from all devices");
  } catch (err) {
    console.error("Error logging out from all devices:", err);
    res.status(500).send("Server error");
  }
};

exports.createAdmin = async () => {
  try {
    const existingAdmin = await Auth.findOne({});
    if (existingAdmin) {
      console.log('Admin already exists with ID:', existingAdmin._id);
      return;
    }

    const admin = new Auth({
      username: 'admin',
      password: 'adminPass', 
    });

    await admin.save();
    console.log('Admin user created with ID:', admin._id);
  } catch (err) {
    console.error('Error creating admin:', err);
  }
};

exports.initializeAdmin = async () => {
  await this.createAdmin();
  try {
    const admins = await Auth.find({}, '_id username');
    if (admins.length > 0) {
      console.log('Existing Admins:', admins.map(admin => `ID: ${admin._id}, Username: ${admin.username}`));
    } else {
      console.log('No admins found in the database.');
    }
  } catch (err) {
    console.error('Error fetching admin IDs:', err);
  }
};
