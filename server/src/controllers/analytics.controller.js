const Expense = require("../models/Expense.model");
const { asyncHandler, ApiResponse } = require("../utils/asyncHandler");

const getDateRange = (req) => {
    const now = new Date();
    const from = req.query.from
        ? new Date(req.query.from)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = req.query.to
        ? new Date(req.query.to)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { from, to };
};

// GET /api/analytics/summary
const getSummary = asyncHandler(async (req, res) => {
    const { from, to } = getDateRange(req);
    const userId = req.user._id;

    const filter = { userId, deletedAt: null, expenseDate: { $gte: from, $lte: to } };

    const [result, largest] = await Promise.all([
        Expense.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$homeAmount" },
                    count: { $sum: 1 },
                },
            },
        ]),
        Expense.findOne(filter).sort({ homeAmount: -1 }).populate("categoryId", "name icon color"),
    ]);

    const total = result[0]?.total || 0;
    const count = result[0]?.count || 0;
    const days = Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)));
    const avgDaily = total / days;

    // Compare to previous period
    const periodMs = to - from;
    const prevFrom = new Date(from.getTime() - periodMs);
    const prevTo = new Date(from.getTime() - 1);
    const prevResult = await Expense.aggregate([
        { $match: { userId, deletedAt: null, expenseDate: { $gte: prevFrom, $lte: prevTo } } },
        { $group: { _id: null, total: { $sum: "$homeAmount" } } },
    ]);
    const prevTotal = prevResult[0]?.total || 0;
    const delta = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

    ApiResponse(res, 200, {
        total: parseFloat(total.toFixed(2)),
        count,
        avgDaily: parseFloat(avgDaily.toFixed(2)),
        largest: largest || null,
        delta: delta !== null ? parseFloat(delta.toFixed(1)) : null,
        period: { from, to },
    });
});

// GET /api/analytics/by-category
const getByCategory = asyncHandler(async (req, res) => {
    const { from, to } = getDateRange(req);

    const result = await Expense.aggregate([
        {
            $match: {
                userId: req.user._id,
                deletedAt: null,
                expenseDate: { $gte: from, $lte: to },
            },
        },
        {
            $group: {
                _id: "$categoryId",
                total: { $sum: "$homeAmount" },
                count: { $sum: 1 },
            },
        },
        { $sort: { total: -1 } },
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "category",
            },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                categoryId: "$_id",
                categoryName: { $ifNull: ["$category.name", "Uncategorized"] },
                categoryIcon: { $ifNull: ["$category.icon", "tag"] },
                categoryColor: { $ifNull: ["$category.color", "#94a3b8"] },
                total: { $round: ["$total", 2] },
                count: 1,
            },
        },
    ]);

    const grandTotal = result.reduce((s, r) => s + r.total, 0);
    const withPct = result.map((r) => ({
        ...r,
        pct: grandTotal > 0 ? parseFloat(((r.total / grandTotal) * 100).toFixed(1)) : 0,
    }));

    ApiResponse(res, 200, withPct);
});

// GET /api/analytics/by-merchant
const getByMerchant = asyncHandler(async (req, res) => {
    const { from, to } = getDateRange(req);

    const result = await Expense.aggregate([
        {
            $match: {
                userId: req.user._id,
                deletedAt: null,
                expenseDate: { $gte: from, $lte: to },
                merchant: { $exists: true, $ne: "" },
            },
        },
        {
            $group: {
                _id: "$merchant",
                total: { $sum: "$homeAmount" },
                count: { $sum: 1 },
            },
        },
        { $sort: { total: -1 } },
        { $limit: 20 },
        {
            $project: {
                merchant: "$_id",
                total: { $round: ["$total", 2] },
                count: 1,
                _id: 0,
            },
        },
    ]);

    ApiResponse(res, 200, result);
});

// GET /api/analytics/trends
const getTrends = asyncHandler(async (req, res) => {
    const { from, to } = getDateRange(req);

    const result = await Expense.aggregate([
        {
            $match: {
                userId: req.user._id,
                deletedAt: null,
                expenseDate: { $gte: from, $lte: to },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$expenseDate" },
                },
                total: { $sum: "$homeAmount" },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                date: "$_id",
                total: { $round: ["$total", 2] },
                count: 1,
                _id: 0,
            },
        },
    ]);

    ApiResponse(res, 200, result);
});

module.exports = { getSummary, getByCategory, getByMerchant, getTrends };
