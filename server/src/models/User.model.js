const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        emailVerified: { type: Boolean, default: false },
        emailVerificationToken: String,
        emailVerificationExpires: Date,
        passwordHash: { type: String }, // null for OAuth-only users
        displayName: { type: String, trim: true, maxlength: 100 },
        homeCurrency: { type: String, default: "USD", uppercase: true, length: 3 },
        timezone: { type: String, default: "UTC" },
        plan: { type: String, enum: ["free", "pro"], default: "free" },
        avatar: String,
        // Password reset
        passwordResetToken: String,
        passwordResetExpires: Date,
        // Login security
        failedLoginAttempts: { type: Number, default: 0 },
        lockoutUntil: Date,
        deletedAt: Date,
    },
    { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
    if (!this.passwordHash) return false;
    return bcrypt.compare(password, this.passwordHash);
};

userSchema.pre("save", async function () {
    if (!this.isModified("passwordHash") || !this.passwordHash) return;
    // Only hash if it's a plain text password (not already hashed)
    if (!this.passwordHash.startsWith("$2")) {
        this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
});

module.exports = mongoose.model("User", userSchema);
