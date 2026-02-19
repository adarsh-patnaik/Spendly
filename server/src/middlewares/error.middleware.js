const errorHandler = (err, req, res, next) => {
    console.error("Error:", err.message);

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
