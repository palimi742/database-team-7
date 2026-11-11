import { Router } from "express";
import pool from "../../db.js";
const router = Router();

router.patch("/:inventoryID", async (req, res) => {
  const inventoryID = Number(req.params.inventoryID);
  const product = req.body ?? {};

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
  if (
    product.stockQuantity === undefined ||
    product.stockQuantity === null ||
    String(product.stockQuantity).trim() === "" ||
    !Number.isSafeInteger(stockQuantity) ||
    stockQuantity < 0
  ) {
    return res.status(400).json({
      message: "Stock quantity must be a whole number of zero or more.",
    });
  }

  const reorderThreshold = Number(product.reorderThreshold);
  if (
    product.reorderThreshold === undefined ||
    product.reorderThreshold === null ||
    String(product.reorderThreshold).trim() === "" ||
    !Number.isSafeInteger(reorderThreshold) ||
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
      message:
        "Restock target must be a whole number greater than the reorder threshold.",
    });
  }

  const { isActive } = product;
  if (isActive !== undefined && isActive !== "0" && isActive !== "1") {
    return res.status(400).json({ message: "Choose Active or Inactive." });
  }

  try {
    const results = await pool.query(
      `UPDATE Inventory
            SET InventoryName = ?, Price = ?, CategoryID = ?, StockQuantity = ?, ReorderThreshold = ?, RestockTargetQuantity = ?,
                IsActive = COALESCE(?, IsActive)
            WHERE InventoryID = ? AND ArchivedAt IS NULL AND TRIM(ImageURL) <> ''`,
      [
        product.name,
        product.price,
        categoryID,
        stockQuantity,
        reorderThreshold,
        restockTargetQuantity,
        isActive === undefined ? null : Number(isActive),
        inventoryID,
      ],
    );
    if (results[0].affectedRows === 0) {
      const [[product]] = await pool.query(
        "SELECT InventoryID, ArchivedAt FROM Inventory WHERE InventoryID = ?",
        [inventoryID],
      );
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (product.ArchivedAt) {
        return res
          .status(409)
          .json({ message: "Restore this product before editing it." });
      }
      return res.status(400).json({
        message: "Upload a product image before saving changes.",
      });
    }
    res.json({
      message: "Product updated",
    });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message: "That category no longer exists. Choose another category.",
      });
    }
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That product name already exists. Enter a unique name.",
      });
    }
    console.log(err.message);
    res.status(500).json({
      message: "Unable to update product",
    });
  }
});

export default router;
