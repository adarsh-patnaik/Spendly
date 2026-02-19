const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const ApiResponse = (res, statusCode, data, meta = null) => {
    return res.status(statusCode).json({
        success: true,
        data,
        ...(meta && { meta }),
        error: null,
    });
};

module.exports = { asyncHandler, ApiResponse };
