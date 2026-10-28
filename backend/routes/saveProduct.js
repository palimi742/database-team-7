import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  const product = req.body;

  try {
    await pool.query(
      `INSERT INTO Inventory
        (SKU, InventoryName, CategoryID, Price, StockQuantity, ReorderThreshold)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        product.sku,
        product.name,
        product.categoryID,
        product.price,
        product.stockQuantity,
        product.reorderThreshold,
      ],
    );

    res.status(201).json({
      message: "Product added to the database successfully",
    });
  } catch (err) {
    console.error("Failed to add product:", err.message);
    res.status(500).json({ message: "Unable to add product" });
  }
});

export default router;
