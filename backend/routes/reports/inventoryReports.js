import { Router } from "express";
import { requireStaff } from "../../auth/staffSession.js";
import pool from "../../db.js";

const router = Router();

router.get("/lowStock", async (req, res) => {
  try {
    const [rows] = await pool.query(
      ` select * from low_inventory_report
           order by StockQuantity asc;`,
    );

    res.json(rows);
  } catch (error) {
    console.error("Error gettng low inventory:", error.message);
    res.status(500).json({
      message: `Unable to fetch low inventory report`,
    });
  }
});

// Inventory report for signed-in staff.
// Example: /api/reports/inventory/stock?status=Low&search=milk
router.get("/stock", requireStaff, async (req, res) => {
  res.set("Cache-Control", "no-store");

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";

  const status =
    typeof req.query.status === "string" ? req.query.status : "All";

  const allowedStatuses = ["All", "Out of stock", "Low", "Normal", "High"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid stock status.",
    });
  }

  if (search.length > 100) {
    return res.status(400).json({
      message: "Search must be 100 characters or fewer.",
    });
  }

  try {
    const conditions = [];
    const parameters = [];

    if (search) {
      conditions.push("(InventoryName LIKE ? OR SKU LIKE ?)");
      parameters.push(`%${search}%`, `%${search}%`);
    }

    if (status !== "All") {
      conditions.push("StockStatus = ?");
      parameters.push(status);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Only values are supplied by the user.
    // SQL conditions above are defined by the application.
    const [items] = await pool.query(
      `SELECT
         InventoryID,
         SKU,
         InventoryName,
         CategoryID,
         StockQuantity,
         ReorderThreshold,
         StockStatus
       FROM employee_inventory_stock_report
       ${whereClause}
       ORDER BY StockQuantity ASC, InventoryName ASC`,
      parameters,
    );

    // Summary cards show counts across the entire inventory.
    const [counts] = await pool.query(
      `SELECT
         COUNT(*) AS TotalProducts,
         COALESCE(SUM(StockStatus = 'Out of stock'), 0)
           AS OutOfStock,
         COALESCE(SUM(StockStatus = 'Low'), 0)
           AS LowStock,
         COALESCE(SUM(StockStatus = 'Normal'), 0)
           AS NormalStock,
         COALESCE(SUM(StockStatus = 'High'), 0)
           AS HighStock
       FROM employee_inventory_stock_report`,
    );

    const summary = Object.fromEntries(
      Object.entries(counts[0]).map(([key, value]) => [key, Number(value)]),
    );

    res.json({
      items,
      summary,
    });
  } catch (error) {
    console.error("Inventory report failed:", error.message);

    res.status(500).json({
      message: "Unable to load the inventory stock report.",
    });
  }
});

export default router;
