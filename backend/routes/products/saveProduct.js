import { Router } from "express";
import pool from "../../db.js";

const router = Router();

router.post("/", async (req, res) => {
  const product = req.body ?? {};
  const reorderThreshold = Number(product.reorderThreshold);
  if (
    !["number", "string"].includes(typeof product.reorderThreshold) ||
    String(product.reorderThreshold).trim() === "" ||
    !Number.isInteger(reorderThreshold) ||
    reorderThreshold < 0
  ) {
    return res.status(400).json({
      message: "Reorder threshold must be a whole number of zero or more.",
    });
  }

  const restockTargetQuantity = Number(product.restockTargetQuantity);
  if (
    !["number", "string"].includes(typeof product.restockTargetQuantity) ||
    !Number.isInteger(restockTargetQuantity) ||
    restockTargetQuantity <= reorderThreshold ||
    restockTargetQuantity > 2147483647
  ) {
    return res.status(400).json({
      message: "Restock target must be a whole number greater than the reorder threshold.",
    });
  }

  try {
    await pool.query(
      `INSERT INTO Inventory
        (SKU, InventoryName, CategoryID, Price, StockQuantity, ReorderThreshold, RestockTargetQuantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product.sku,
        product.name,
        product.categoryID,
        product.price,
        product.stockQuantity,
        reorderThreshold,
        restockTargetQuantity,
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
