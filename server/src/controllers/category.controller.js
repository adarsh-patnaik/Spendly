const Category = require("../models/Category.model");
const Expense = require("../models/Expense.model");
const { asyncHandler, ApiResponse } = require("../utils/asyncHandler");
const { ApiError } = require("../middlewares/error.middleware");

// GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({
        $or: [{ userId: null }, { userId: req.user._id }],
        isActive: true,
    }).sort({ sortOrder: 1, name: 1 });

    ApiResponse(res, 200, categories);
});

// POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
    const { name, icon, color } = req.body;
    if (!name) throw new ApiError(400, "Category name is required");

    // Free plan: max 5 custom categories
    if (req.user.plan === "free") {
        const count = await Category.countDocuments({ userId: req.user._id, isActive: true });
        if (count >= 5) throw new ApiError(403, "Free plan allows up to 5 custom categories");
    }

    const category = await Category.create({
        userId: req.user._id,
        name: name.trim(),
        icon: icon || "tag",
        color: color || "#6366f1",
    });

    ApiResponse(res, 201, category);
});

// PATCH /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });
    if (!category) throw new ApiError(404, "Category not found");

    const { name, icon, color } = req.body;
    if (name) category.name = name.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();
    ApiResponse(res, 200, category);
});

// DELETE /api/categories/:id (archive)
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });
    if (!category) throw new ApiError(404, "Category not found");

    const expenseCount = await Expense.countDocuments({
        userId: req.user._id,
        categoryId: req.params.id,
        deletedAt: null,
    });

    if (expenseCount > 0) {
        // Archive instead of delete
        category.isActive = false;
        await category.save();
        return ApiResponse(res, 200, { message: "Category archived (has associated expenses)" });
    }

    await category.deleteOne();
    ApiResponse(res, 200, { message: "Category deleted" });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
