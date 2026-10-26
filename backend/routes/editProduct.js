import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.patch("/:inventoryID", async (req, res) => {
  const inventoryID = Number(req.params.inventoryID);
  const product = req.body;

  if (!Number.isInteger(inventoryID) || inventoryID <= 0) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  try {
    const results = await pool.query(
      `UPDATE Inventory
            SET SKU = ?, InventoryName = ?, Price = ?
            WHERE InventoryID = ?`,
      [product.sku, product.name, product.price, inventoryID],
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
    console.log(err.message);
    res.status(500).json({
      message: "Unable to update product",
    });
  }
});

export default router;
