const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { getSummary, getByCategory, getByMerchant, getTrends } = require("../controllers/analytics.controller");

router.use(authenticate);
router.get("/summary", getSummary);
router.get("/by-category", getByCategory);
router.get("/by-merchant", getByMerchant);
router.get("/trends", getTrends);

module.exports = router;
