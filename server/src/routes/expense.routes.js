const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const {
    getExpenses, createExpense, getExpense,
    updateExpense, deleteExpense, exportCsv,
} = require("../controllers/expense.controller");

router.use(authenticate);

router.get("/export/csv", exportCsv);
router.get("/", getExpenses);
router.post("/", createExpense);
router.get("/:id", getExpense);
router.patch("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
