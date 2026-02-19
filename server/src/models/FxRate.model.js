const mongoose = require("mongoose");

const fxRateSchema = new mongoose.Schema({
    baseCurrency: { type: String, required: true, uppercase: true, length: 3 },
    targetCurrency: { type: String, required: true, uppercase: true, length: 3 },
    rate: { type: Number, required: true },
    fetchedAt: { type: Date, required: true, default: Date.now },
});

fxRateSchema.index({ baseCurrency: 1, targetCurrency: 1, fetchedAt: -1 });

module.exports = mongoose.model("FxRate", fxRateSchema);
