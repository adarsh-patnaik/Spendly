const { categorize, recordFeedback } = require("../utils/ai.util");
const Expense = require("../models/Expense.model");
const { asyncHandler, ApiResponse } = require("../utils/asyncHandler");
const { ApiError } = require("../middlewares/error.middleware");

// POST /api/ai/categorize
const categorizeExpense = asyncHandler(async (req, res) => {
    const { merchant, notes } = req.body;
    if (!merchant) throw new ApiError(400, "Merchant name is required");

    const result = await categorize(merchant, notes, req.user._id);

    if (!result) {
        return ApiResponse(res, 200, { categoryId: null, categoryName: null, confidence: 0 });
    }

    ApiResponse(res, 200, result);
});

// POST /api/ai/feedback
const submitFeedback = asyncHandler(async (req, res) => {
    const { expenseId, accepted, categoryId } = req.body;

    const expense = await Expense.findOne({ _id: expenseId, userId: req.user._id });
    if (!expense) throw new ApiError(404, "Expense not found");

    await recordFeedback(req.user._id, expense.merchant, categoryId || expense.categoryId, accepted);

    ApiResponse(res, 200, { message: "Feedback recorded" });
});

module.exports = { categorizeExpense, submitFeedback };
