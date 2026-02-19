const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null = system default
        name: { type: String, required: true, trim: true, maxlength: 100 },
        icon: { type: String, default: "tag" },
        color: { type: String, default: "#6366f1" }, // hex color
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

categorySchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("Category", categorySchema);
