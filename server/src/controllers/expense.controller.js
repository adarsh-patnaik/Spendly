const Expense = require("../models/Expense.model");
const { asyncHandler, ApiResponse } = require("../utils/asyncHandler");
const { ApiError } = require("../middlewares/error.middleware");
const { getRate } = require("../utils/fx.util");

// GET /api/expenses
const getExpenses = asyncHandler(async (req, res) => {
    const {
        from, to, category_id, currency, q,
        sort = "date_desc", page = 1, limit = 50,
    } = req.query;

    const filter = { userId: req.user._id, deletedAt: null };

    if (from || to) {
        filter.expenseDate = {};
        if (from) filter.expenseDate.$gte = new Date(from);
        if (to) filter.expenseDate.$lte = new Date(to);
    }
    if (category_id) filter.categoryId = category_id;
    if (currency) filter.currency = currency.toUpperCase();
    if (q) filter.$text = { $search: q };

    const sortMap = {
        date_desc: { expenseDate: -1 },
        date_asc: { expenseDate: 1 },
        amount_desc: { homeAmount: -1 },
        amount_asc: { homeAmount: 1 },
        merchant_asc: { merchant: 1 },
    };
    const sortObj = sortMap[sort] || { expenseDate: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
        Expense.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .populate("categoryId", "name icon color"),
        Expense.countDocuments(filter),
    ]);

    ApiResponse(res, 200, expenses, {
        page: parseInt(page),
        per_page: parseInt(limit),
        total,
    });
});

// POST /api/expenses
const createExpense = asyncHandler(async (req, res) => {
    const {
        amount, currency, expenseDate, categoryId,
        merchant, notes, isRecurring, aiCategoryId, aiConfidence, aiUsed,
    } = req.body;

    if (!amount || !currency) throw new ApiError(400, "Amount and currency are required");

    const homeCurrency = req.user.homeCurrency || "USD";
    let homeAmount = amount;
    let fxRate = 1;
    let fxRateDate = new Date();

    if (currency.toUpperCase() !== homeCurrency) {
        fxRate = await getRate(currency.toUpperCase(), homeCurrency);
        homeAmount = parseFloat((amount * fxRate).toFixed(2));
        fxRateDate = new Date();
    }

    const expense = await Expense.create({
        userId: req.user._id,
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        homeAmount,
        homeCurrency,
        fxRate,
        fxRateDate,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        categoryId: categoryId || null,
        merchant,
        notes,
        isRecurring: isRecurring || false,
        aiCategoryId: aiCategoryId || null,
        aiConfidence: aiConfidence || null,
        aiUsed: aiUsed || false,
    });

    const populated = await expense.populate("categoryId", "name icon color");
    ApiResponse(res, 201, populated);
});

// GET /api/expenses/:id
const getExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    }).populate("categoryId", "name icon color");

    if (!expense) throw new ApiError(404, "Expense not found");
    ApiResponse(res, 200, expense);
});

// PATCH /api/expenses/:id
const updateExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });
    if (!expense) throw new ApiError(404, "Expense not found");

    const { amount, currency, expenseDate, categoryId, merchant, notes, isRecurring } = req.body;

    if (amount !== undefined) expense.amount = parseFloat(amount);
    if (currency) {
        expense.currency = currency.toUpperCase();
        // Recalculate FX
        const homeCurrency = req.user.homeCurrency || "USD";
        if (currency.toUpperCase() !== homeCurrency) {
            expense.fxRate = await getRate(currency.toUpperCase(), homeCurrency);
            expense.homeAmount = parseFloat(((amount || expense.amount) * expense.fxRate).toFixed(2));
        } else {
            expense.homeAmount = amount || expense.amount;
            expense.fxRate = 1;
        }
        expense.homeCurrency = homeCurrency;
        expense.fxRateDate = new Date();
    }
    if (expenseDate) expense.expenseDate = new Date(expenseDate);
    if (categoryId !== undefined) expense.categoryId = categoryId || null;
    if (merchant !== undefined) expense.merchant = merchant;
    if (notes !== undefined) expense.notes = notes;
    if (isRecurring !== undefined) expense.isRecurring = isRecurring;

    await expense.save();
    const populated = await expense.populate("categoryId", "name icon color");
    ApiResponse(res, 200, populated);
});

// DELETE /api/expenses/:id (soft delete)
const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });
    if (!expense) throw new ApiError(404, "Expense not found");

    expense.deletedAt = new Date();
    await expense.save();
    ApiResponse(res, 200, { message: "Expense deleted" });
});

// GET /api/expenses/export/csv
const exportCsv = asyncHandler(async (req, res) => {
    const { from, to, category_id } = req.query;
    const filter = { userId: req.user._id, deletedAt: null };

    if (from || to) {
        filter.expenseDate = {};
        if (from) filter.expenseDate.$gte = new Date(from);
        if (to) filter.expenseDate.$lte = new Date(to);
    }
    if (category_id) filter.categoryId = category_id;

    const expenses = await Expense.find(filter)
        .sort({ expenseDate: -1 })
        .populate("categoryId", "name")
        .limit(5000);

    const headers = [
        "Date", "Merchant", "Category", "Notes",
        "Original Amount", "Original Currency",
        "Home Currency Amount", "Home Currency", "Exchange Rate",
    ];

    const rows = expenses.map((e) => [
        e.expenseDate.toISOString().split("T")[0],
        e.merchant || "",
        e.categoryId?.name || "Uncategorized",
        e.notes || "",
        e.amount,
        e.currency,
        e.homeAmount || e.amount,
        e.homeCurrency || e.currency,
        e.fxRate || 1,
    ]);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="spendly-export-${Date.now()}.csv"`);

    const csvContent = [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    res.send(csvContent);
});

module.exports = { getExpenses, createExpense, getExpense, updateExpense, deleteExpense, exportCsv };
