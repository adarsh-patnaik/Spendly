const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const {
    register, login, refresh, logout,
    forgotPassword, resetPassword, verifyEmail,
    getMe, updateMe,
} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

module.exports = router;
