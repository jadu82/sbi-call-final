// controllers/simSlotController.js
const SimSlotActionEvent = require('../models/SimSlotActionEvent');

exports.handleSimSlotEvent = async (req, res) => {
  const { uniqueid, slotActions } = req.body;

  // --- validation as before ---
  if (!uniqueid || typeof uniqueid !== 'string' || uniqueid.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'uniqueid is required and must be a non-empty string'
    });
  }
  if (!Array.isArray(slotActions) || slotActions.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'slotActions must be a non-empty array'
    });
  }

  // Prepare bulk upsert operations
  const ops = slotActions.map(item => {
    if (
      typeof item !== 'object' ||
      item == null ||
      item.simSlot == null ||
      isNaN(item.simSlot) ||
      !['register', 'erase'].includes(item.actionType)
    ) {
      throw new Error('Invalid slotActions entry');
    }
    const simSlotNum = Number(item.simSlot);
    return {
      updateOne: {
        filter: { uniqueid: uniqueid.trim(), simSlot: simSlotNum },
        update: {
          $set: {
            actionType: item.actionType,
            timestamp: new Date()
          }
        },
        upsert: true
      }
    };
  });

  try {
    await SimSlotActionEvent.bulkWrite(ops, { ordered: true });
    return res.json({
      success: true,
      message: 'SIM‑slot events upserted successfully'
    });
  } catch (err) {
    console.error('Error in handleSimSlotEvent:', err);
    return res.status(500).json({
      success: false,
      message: 'Could not save events'
    });
  }
};