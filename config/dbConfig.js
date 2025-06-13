const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string (from .env)
const dbURI = process.env.MONGO_URI;// Use one consistent URI

const connectDB = async () => {
    try {
        // Connect to MongoDB using Mongoose
        await mongoose.connect(dbURI, {
          
            // Removed deprecated options for MongoDB version >= 5
        });
        console.log('MongoDB connected successfully!');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;