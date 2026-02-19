const { getRate, fetchAndStoreAllRates, CURRENCIES } = require("../utils/fx.util");
const FxRate = require("../models/FxRate.model");
const { asyncHandler, ApiResponse } = require("../utils/asyncHandler");
const { ApiError } = require("../middlewares/error.middleware");

// GET /api/fx/rate?from=EUR&to=USD&date=2026-01-15
const getExchangeRate = asyncHandler(async (req, res) => {
    const { from, to, date } = req.query;
    if (!from || !to) throw new ApiError(400, "from and to currency codes are required");

    if (date) {
        // Historical rate
        const targetDate = new Date(date);
        const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
        const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

        const historical = await FxRate.findOne({
            baseCurrency: from.toUpperCase(),
            targetCurrency: to.toUpperCase(),
            fetchedAt: { $gte: dayStart, $lte: dayEnd },
        }).sort({ fetchedAt: -1 });

        if (historical) {
            return ApiResponse(res, 200, { from, to, rate: historical.rate, date: historical.fetchedAt });
        }
    }

    const rate = await getRate(from.toUpperCase(), to.toUpperCase());
    ApiResponse(res, 200, { from: from.toUpperCase(), to: to.toUpperCase(), rate, date: new Date() });
});

// GET /api/fx/currencies
const getCurrencies = asyncHandler(async (req, res) => {
    ApiResponse(res, 200, CURRENCIES);
});

module.exports = { getExchangeRate, getCurrencies };
