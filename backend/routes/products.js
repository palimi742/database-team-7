import { Router } from "express";
import pool from "../db.js";

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
        Inventory.IsActive,
        Inventory.CategoryID,
        Category.CategoryName
      FROM Inventory
      JOIN Category
        ON Inventory.CategoryID = Category.CategoryID
    `;

    const values = [];

    if (categoryID !== undefined) {
      sql += " WHERE Inventory.CategoryID = ?";
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
