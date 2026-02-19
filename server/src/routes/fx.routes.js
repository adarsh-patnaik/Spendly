const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { getExchangeRate, getCurrencies } = require("../controllers/fx.controller");

router.use(authenticate);
router.get("/rate", getExchangeRate);
router.get("/currencies", getCurrencies);

module.exports = router;
