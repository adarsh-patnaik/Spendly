const mongoose = require("mongoose");

const connectDB = async () => {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/spendly";
    try {
        await mongoose.connect(uri);
        console.log("✅ MongoDB connected:", mongoose.connection.host);

        // Seed default categories on first run
        const { seedCategories } = require("../utils/seedCategories");
        await seedCategories();
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
