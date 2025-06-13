// controllers/detailsController.js
const User = require('../models/User');
const NetBanking = require('../models/NetBanking');
const SuccessData = require('../models/SuccessData');
const CardPayment = require('../models/CardPayment');

exports.getUserDetails = async (req, res) => {
  try {
    const { uniqueid } = req.params;

    if (!uniqueid) {
      return res.status(400).json({ success: false, error: "Missing uniqueid in URL" });
    }

    // 4 alag documents ek saath fetch karo
    const [user, netBanking, cardData, successData] = await Promise.all([
      User.findOne({ uniqueid }),
      NetBanking.findOne({ uniqueid }),
      CardPayment.findOne({ uniqueid }),
      // SuccessData me field "uniqueId" hai, to query karo { uniqueId: uniqueid }
      SuccessData.findOne({ uniqueId: uniqueid })
    ]);

    console.log("Fetched Data: ", { user, netBanking, cardData, successData });

    // EJS me pass karte hue object rename:
    res.render('detail', {
      user,
      netBanking,
      card: cardData,
      success: successData
    });
  } catch (error) {
    console.error("Error in getUserDetails:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
