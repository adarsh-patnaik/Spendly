require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/db/index");
const { errorHandler } = require("./src/middlewares/error.middleware");

// Route imports
const authRoutes = require("./src/routes/auth.routes");
const expenseRoutes = require("./src/routes/expense.routes");
const categoryRoutes = require("./src/routes/category.routes");
const budgetRoutes = require("./src/routes/budget.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");
const aiRoutes = require("./src/routes/ai.routes");
const fxRoutes = require("./src/routes/fx.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Spendly API is running 🚀" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/fx", fxRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler
app.use(errorHandler);

// Connect DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Spendly server running on http://localhost:${PORT}`);
  });
});
