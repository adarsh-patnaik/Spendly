const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { getCategories, createCategory, updateCategory, deleteCategory } = require("../controllers/category.controller");

router.use(authenticate);
router.get("/", getCategories);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
