import { Router } from "express";
import pool from "../../db.js";
const router = Router();

router.patch("/:inventoryID", async (req, res) => {
  const inventoryID = Number(req.params.inventoryID);
  const product = req.body;

  if (!Number.isInteger(inventoryID) || inventoryID <= 0) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  const categoryID = Number(product.categoryID);
  const stockQuantity = Number(product.stockQuantity);
  if (!Number.isSafeInteger(categoryID) || categoryID <= 0) {
    return res.status(400).json({ message: "Choose a valid category." });
  }
  if (product.stockQuantity === undefined || product.stockQuantity === null ||
      String(product.stockQuantity).trim() === "" ||
      !Number.isSafeInteger(stockQuantity) || stockQuantity < 0) {
    return res.status(400).json({ message: "Stock quantity must be a whole number of zero or more." });
  }

  const reorderThreshold = Number(product.reorderThreshold);
  if (product.reorderThreshold === undefined || product.reorderThreshold === null ||
      String(product.reorderThreshold).trim() === "" ||
      !Number.isSafeInteger(reorderThreshold) || reorderThreshold < 0) {
    return res.status(400).json({ message: "Reorder threshold must be a whole number of zero or more." });
  }

  try {
    const results = await pool.query(
      `UPDATE Inventory
            SET SKU = ?, InventoryName = ?, Price = ?, CategoryID = ?, StockQuantity = ?, ReorderThreshold = ?
            WHERE InventoryID = ?`,
      [product.sku, product.name, product.price, categoryID, stockQuantity, reorderThreshold, inventoryID],
    );
    if (results[0].affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    res.json({
      message: "Product updated",
    });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "That category no longer exists. Choose another category." });
    }
    if (err.code === "ER_DUP_ENTRY") {
      const field = (err.sqlMessage || err.message || "").includes("uq_inventory_name") ? "name" : "SKU";
      return res.status(409).json({ message: `That product ${field} already exists. Enter a unique ${field}.` });
    }
    console.log(err.message);
    res.status(500).json({
      message: "Unable to update product",
    });
  }
});

export default router;
