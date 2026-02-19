const Budget = require("../models/Budget.model");
const Expense = require("../models/Expense.model");
const { asyncHandler, ApiResponse } = require("../utils/asyncHandler");
const { ApiError } = require("../middlewares/error.middleware");

const getBudgetStatus = async (budget, userId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const filter = {
        userId,
        deletedAt: null,
        expenseDate: { $gte: startOfMonth, $lte: endOfMonth },
    };
    if (budget.categoryId) filter.categoryId = budget.categoryId;

    const result = await Expense.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$homeAmount" } } },
    ]);

    const spent = result[0]?.total || 0;
    const remaining = Math.max(0, budget.amount - spent);
    const pct = Math.round((spent / budget.amount) * 100);

    // Linear projection for end of month
    const dayOfMonth = now.getDate();
    const daysInMonth = endOfMonth.getDate();
    const projected = daysInMonth > 0 ? (spent / dayOfMonth) * daysInMonth : 0;

    return { spent, remaining, pct, projected };
};

// GET /api/budgets
const getBudgets = asyncHandler(async (req, res) => {
    const budgets = await Budget.find({ userId: req.user._id }).populate(
        "categoryId",
        "name icon color"
    );

    const budgetsWithStatus = await Promise.all(
        budgets.map(async (b) => {
            const status = await getBudgetStatus(b, req.user._id);
            return { ...b.toObject(), ...status };
        })
    );

    ApiResponse(res, 200, budgetsWithStatus);
});

// POST /api/budgets
const createBudget = asyncHandler(async (req, res) => {
    const { categoryId, amount, period, startDate, endDate, alert80, alert100 } = req.body;
    if (!amount) throw new ApiError(400, "Amount is required");

    const budget = await Budget.create({
        userId: req.user._id,
        categoryId: categoryId || null,
        amount: parseFloat(amount),
        currency: req.user.homeCurrency || "USD",
        period: period || "monthly",
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        alert80: alert80 !== undefined ? alert80 : true,
        alert100: alert100 !== undefined ? alert100 : true,
    });

    const populated = await budget.populate("categoryId", "name icon color");
    const status = await getBudgetStatus(budget, req.user._id);
    ApiResponse(res, 201, { ...populated.toObject(), ...status });
});

// PATCH /api/budgets/:id
const updateBudget = asyncHandler(async (req, res) => {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    if (!budget) throw new ApiError(404, "Budget not found");

    const { amount, alert80, alert100, categoryId } = req.body;
    if (amount !== undefined) budget.amount = parseFloat(amount);
    if (alert80 !== undefined) budget.alert80 = alert80;
    if (alert100 !== undefined) budget.alert100 = alert100;
    if (categoryId !== undefined) budget.categoryId = categoryId || null;

    await budget.save();
    const populated = await budget.populate("categoryId", "name icon color");
    const status = await getBudgetStatus(budget, req.user._id);
    ApiResponse(res, 200, { ...populated.toObject(), ...status });
});

// DELETE /api/budgets/:id
const deleteBudget = asyncHandler(async (req, res) => {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!budget) throw new ApiError(404, "Budget not found");
    ApiResponse(res, 200, { message: "Budget deleted" });
});

// GET /api/budgets/:id/status
const getBudgetStatusById = asyncHandler(async (req, res) => {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    if (!budget) throw new ApiError(404, "Budget not found");
    const status = await getBudgetStatus(budget, req.user._id);
    ApiResponse(res, 200, status);
});

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetStatusById };
