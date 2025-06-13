const express = require("express");
const router = express.Router();
const { saveSimInfo } = require("../controllers/simController");

router.post("/save", saveSimInfo); 


module.exports = router;
