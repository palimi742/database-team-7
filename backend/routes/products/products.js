import { Router } from "express";
import pool from "../../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { categoryID } = req.query;

  if (
    categoryID !== undefined &&
    (typeof categoryID !== "string" || !/^[1-9]\d*$/.test(categoryID))
  ) {
    return res.status(400).json({
      message: "Invalid category ID.",
    });
  }
  try {
    let sql = `
      SELECT
        Inventory.InventoryID,
        Inventory.SKU,
        Inventory.InventoryName,
        Inventory.Price,
        Inventory.StockQuantity,
        Inventory.ReorderThreshold,
        Inventory.IsActive,
        Inventory.CategoryID,
        Category.CategoryName
      FROM Inventory
      JOIN Category
        ON Inventory.CategoryID = Category.CategoryID
    `;

    const values = [];
    sql += req.employee ? " WHERE 1 = 1" : " WHERE Inventory.IsActive = TRUE";

    if (categoryID !== undefined) {
      sql += " AND Inventory.CategoryID = ?";
      values.push(categoryID);
    }

    sql += " ORDER BY Inventory.InventoryName";

    const [rows] = await pool.query(sql, values);
    res.json(rows);
  } catch (error) {
    console.error("Query failed:", error.message);
    res.status(500).json({
      message: "Unable to load products.",
    });
  }
});

export default router;
