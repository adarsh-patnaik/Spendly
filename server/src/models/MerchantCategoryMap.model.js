const mongoose = require("mongoose");

const merchantCategoryMapSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null, // null = global/system-wide
        },
        merchantKey: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        }, // normalized lowercase merchant name
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        confidence: { type: Number, min: 0, max: 100 },
        overrideCount: { type: Number, default: 0 }, // times user corrected this mapping
        lastUsedAt: Date,
    },
    { timestamps: true }
);

merchantCategoryMapSchema.index({ userId: 1, merchantKey: 1 }, { unique: true });

module.exports = mongoose.model("MerchantCategoryMap", merchantCategoryMapSchema);
