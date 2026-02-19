const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetStatusById } = require("../controllers/budget.controller");

router.use(authenticate);
router.get("/", getBudgets);
router.post("/", createBudget);
router.patch("/:id", updateBudget);
router.delete("/:id", deleteBudget);
router.get("/:id/status", getBudgetStatusById);

module.exports = router;
