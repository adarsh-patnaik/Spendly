const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User.model");
const RefreshToken = require("../models/RefreshToken.model");
const { asyncHandler, ApiResponse } = require("../utils/asyncHandler");
const { ApiError } = require("../middlewares/error.middleware");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email.util");

const generateTokens = async (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    await RefreshToken.create({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return { accessToken, refreshToken };
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
    const { email, password, displayName } = req.body;

    if (!email || !password) throw new ApiError(400, "Email and password are required");
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new ApiError(409, "Email already registered");

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
        email: email.toLowerCase(),
        passwordHash: password,
        displayName: displayName || email.split("@")[0],
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    try { await sendVerificationEmail(user.email, verificationToken); } catch (e) { console.warn('Email send failed (SMTP not configured):', e.message); }

    const { accessToken, refreshToken } = await generateTokens(user._id);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    ApiResponse(res, 201, {
        user: {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            homeCurrency: user.homeCurrency,
            emailVerified: user.emailVerified,
            plan: user.plan,
        },
        accessToken,
    });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) throw new ApiError(400, "Email and password are required");

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new ApiError(401, "Invalid credentials");

    // Check lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        const mins = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
        throw new ApiError(429, `Account locked. Try again in ${mins} minute(s)`);
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) {
            user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
            user.failedLoginAttempts = 0;
        }
        await user.save();
        throw new ApiError(401, "Invalid credentials");
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    const { accessToken, refreshToken } = await generateTokens(user._id);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    ApiResponse(res, 200, {
        user: {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            homeCurrency: user.homeCurrency,
            emailVerified: user.emailVerified,
            plan: user.plan,
        },
        accessToken,
    });
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) throw new ApiError(401, "No refresh token");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const stored = await RefreshToken.findOne({ tokenHash, revoked: false });

    if (!stored || stored.expiresAt < new Date()) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    // Rotate: revoke old, issue new
    stored.revoked = true;
    await stored.save();

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(stored.userId);

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    ApiResponse(res, 200, { accessToken });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
    }
    res.clearCookie("refreshToken");
    ApiResponse(res, 200, { message: "Logged out successfully" });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Always return success to prevent email enumeration
    if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();
        try { await sendPasswordResetEmail(user.email, token); } catch (e) { console.warn('Email send failed (SMTP not configured):', e.message); }
    }

    ApiResponse(res, 200, { message: "If that email exists, a reset link has been sent" });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) throw new ApiError(400, "Token and password are required");
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
    });

    if (!user) throw new ApiError(400, "Invalid or expired reset token");

    user.passwordHash = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all refresh tokens
    await RefreshToken.updateMany({ userId: user._id }, { revoked: true });

    ApiResponse(res, 200, { message: "Password reset successfully" });
});

// GET /api/auth/verify-email/:token
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) throw new ApiError(400, "Invalid or expired verification token");

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    ApiResponse(res, 200, { message: "Email verified successfully" });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
    ApiResponse(res, 200, {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
        homeCurrency: req.user.homeCurrency,
        timezone: req.user.timezone,
        emailVerified: req.user.emailVerified,
        plan: req.user.plan,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
    });
});

// PATCH /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
    const { displayName, homeCurrency, timezone } = req.body;
    const updates = {};
    if (displayName) updates.displayName = displayName;
    if (homeCurrency) updates.homeCurrency = homeCurrency.toUpperCase();
    if (timezone) updates.timezone = timezone;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select(
        "-passwordHash"
    );

    ApiResponse(res, 200, {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        homeCurrency: user.homeCurrency,
        timezone: user.timezone,
        plan: user.plan,
    });
});

module.exports = {
    register, login, refresh, logout,
    forgotPassword, resetPassword, verifyEmail,
    getMe, updateMe,
};
