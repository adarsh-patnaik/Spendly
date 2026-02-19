const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { categorizeExpense, submitFeedback } = require("../controllers/ai.controller");

router.use(authenticate);
router.post("/categorize", categorizeExpense);
router.post("/feedback", submitFeedback);

module.exports = router;
