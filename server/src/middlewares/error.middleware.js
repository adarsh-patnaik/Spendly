const errorHandler = (err, req, res, next) => {
    console.error("Error:", err.message);

    // MongoDB duplicate key (e.g. email already registered)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "field";
        return res.status(409).json({
            success: false,
            error: `${field.charAt(0).toUpperCase() + field.slice(1)} already registered`,
        });
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map((e) => e.message).join(", ");
        return res.status(400).json({ success: false, error: message });
    }

    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : "Internal server error";

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

module.exports = { errorHandler, ApiError };
