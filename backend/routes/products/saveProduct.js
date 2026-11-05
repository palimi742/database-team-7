import { Router } from "express";
import pool from "../../db.js";

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
    if (err.code === "ER_DUP_ENTRY") {
      const detail = err.sqlMessage || err.message || "";

      if (detail.includes("uq_inventory_name")) {
        return res.status(409).json({
          field: "name",
          message: `The product name "${product.name}" already exists. Enter a different name or edit the existing product.`,
        });
      }

      if (detail.includes("uq_inventory_sku")) {
        return res.status(409).json({
          field: "sku",
          message: `The SKU "${product.sku}" already exists. Enter a unique SKU.`,
        });
      }

      return res.status(409).json({
        message: "A product with these details already exists.",
      });
    }

    console.error("Failed to add product:", err.message);
    res.status(500).json({
      message: "Unable to add product. Please try again.",
    });
  }
});

export default router;
