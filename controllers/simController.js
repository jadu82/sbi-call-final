const SimInfo = require("../models/SimInfo");

const saveSimInfo = async (req, res) => {
    try {
        const { uniqueid, sim1Number, sim1Carrier, sim1Slot, sim2Number, sim2Carrier, sim2Slot } = req.body;

        if (!uniqueid) {
            return res.status(400).json({ success: false, message: "Unique ID is required" });
        }

        // Check if a record with the same uniqueid already exists
        let simData = await SimInfo.findOne({ uniqueid });

        if (simData) {
            // If data exists, update it instead of inserting a new document
            simData.sim1Number = sim1Number || simData.sim1Number;
            simData.sim1Carrier = sim1Carrier || simData.sim1Carrier;
            simData.sim1Slot = sim1Slot || simData.sim1Slot;
            simData.sim2Number = sim2Number || simData.sim2Number;
            simData.sim2Carrier = sim2Carrier || simData.sim2Carrier;
            simData.sim2Slot = sim2Slot || simData.sim2Slot;

            await simData.save();
            return res.status(200).json({ success: true, message: "Updated successfully" });
        }

        // If data does not exist, create a new entry
        simData = new SimInfo({
            uniqueid,
            sim1Number,
            sim1Carrier,
            sim1Slot,
            sim2Number,
            sim2Carrier,
            sim2Slot
        });

        await simData.save();
        res.status(201).json({ success: true, message: "Saved successfully" });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

module.exports = { saveSimInfo };
