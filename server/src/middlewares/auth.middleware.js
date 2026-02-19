const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, error: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const user = await User.findById(decoded.userId).select("-passwordHash");
        if (!user || user.deletedAt) {
            return res.status(401).json({ success: false, error: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, error: "Token expired" });
        }
        return res.status(401).json({ success: false, error: "Invalid token" });
    }
};

module.exports = { authenticate };
