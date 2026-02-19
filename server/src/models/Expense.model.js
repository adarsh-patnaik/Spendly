const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: { type: Number, required: true, min: 0 }, // original amount
        currency: { type: String, required: true, uppercase: true, length: 3 }, // original currency
        homeAmount: { type: Number }, // converted to home currency
        homeCurrency: { type: String, uppercase: true, length: 3 }, // user's home currency at time of entry
        fxRate: { type: Number }, // rate used for conversion
        fxRateDate: { type: Date }, // when rate was fetched
        expenseDate: { type: Date, required: true, default: Date.now },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        merchant: { type: String, trim: true, maxlength: 255 },
        notes: { type: String, maxlength: 500 },
        receiptUrl: String,
        // AI fields
        aiCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        aiConfidence: { type: Number, min: 0, max: 100 }, // 0-100
        aiUsed: { type: Boolean, default: false }, // did user accept AI suggestion?
        isRecurring: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

expenseSchema.index({ userId: 1, expenseDate: -1 });
expenseSchema.index({ userId: 1, categoryId: 1 });
expenseSchema.index({ userId: 1, merchant: "text", notes: "text" });

module.exports = mongoose.model("Expense", expenseSchema);
