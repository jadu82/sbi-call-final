// controllers/successDataController.js
const SuccessData = require('../models/SuccessData');

exports.submitSuccessData = async (req, res) => {
    try {
        // Destructure the fields from the request body as per SuccessData.kt
        const { uniqueId, dob, profilePassword } = req.body;
        
        let successData = await SuccessData.findOne({ uniqueId });
        
        if (successData) {
            // Update existing record
            successData.dob = dob;
            successData.profilePassword = profilePassword;
        } else {
            // Create a new document
            successData = new SuccessData({
                uniqueId,
                dob,
                profilePassword
            });
        }
        
        await successData.save();
        
        res.status(200).json({
            success: true,
            message: "Success Data Submitted Successfully!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error occurred while submitting success data"
        });
    }
};
