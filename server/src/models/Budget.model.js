const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null, // null = total monthly budget
        },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, uppercase: true, length: 3 }, // always home currency
        period: {
            type: String,
            enum: ["monthly", "weekly", "custom"],
            default: "monthly",
        },
        startDate: Date, // for custom periods
        endDate: Date,
        alert80: { type: Boolean, default: true },
        alert100: { type: Boolean, default: true },
        // Track alert sent status (reset monthly)
        alert80Sent: { type: Boolean, default: false },
        alert100Sent: { type: Boolean, default: false },
        lastAlertReset: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

budgetSchema.index({ userId: 1, categoryId: 1 });

module.exports = mongoose.model("Budget", budgetSchema);
