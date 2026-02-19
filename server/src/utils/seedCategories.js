require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Category = require("../models/Category.model");

const DEFAULT_CATEGORIES = [
    { name: "Food & Dining", icon: "utensils", color: "#f97316", sortOrder: 1 },
    { name: "Transportation", icon: "car", color: "#3b82f6", sortOrder: 2 },
    { name: "Shopping", icon: "shopping-bag", color: "#ec4899", sortOrder: 3 },
    { name: "Entertainment", icon: "film", color: "#8b5cf6", sortOrder: 4 },
    { name: "Health & Wellness", icon: "heart", color: "#10b981", sortOrder: 5 },
    { name: "Housing & Utilities", icon: "home", color: "#6366f1", sortOrder: 6 },
    { name: "Travel", icon: "plane", color: "#0ea5e9", sortOrder: 7 },
    { name: "Education", icon: "book", color: "#f59e0b", sortOrder: 8 },
    { name: "Business", icon: "briefcase", color: "#64748b", sortOrder: 9 },
    { name: "Personal Care", icon: "sparkles", color: "#d946ef", sortOrder: 10 },
    { name: "Subscriptions", icon: "repeat", color: "#14b8a6", sortOrder: 11 },
    { name: "Gifts & Donations", icon: "gift", color: "#f43f5e", sortOrder: 12 },
    { name: "Taxes & Fees", icon: "receipt", color: "#78716c", sortOrder: 13 },
    { name: "Uncategorized", icon: "tag", color: "#94a3b8", sortOrder: 14 },
];

const seedCategories = async () => {
    try {
        const existing = await Category.countDocuments({ userId: null, isDefault: true });
        if (existing >= 14) return; // Already seeded

        for (const cat of DEFAULT_CATEGORIES) {
            await Category.findOneAndUpdate(
                { name: cat.name, userId: null },
                { ...cat, isDefault: true, userId: null },
                { upsert: true }
            );
        }
        console.log("✅ Default categories seeded");
    } catch (err) {
        console.error("Category seed error:", err.message);
    }
};

// Allow running directly: node src/utils/seedCategories.js
if (require.main === module) {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/spendly";
    mongoose.connect(uri).then(async () => {
        await seedCategories();
        mongoose.disconnect();
    });
}

module.exports = { seedCategories };
