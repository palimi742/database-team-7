import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.patch("/:inventoryID/restore", async (req, res) => {
  const inventoryID = Number(req.params.inventoryID);
  if (!Number.isInteger(inventoryID) || inventoryID <= 0) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  try {
    const results = await pool.query(
      `
            UPDATE Inventory
            SET IsActive = TRUE
            WHERE InventoryID = ?
            `,
      [inventoryID],
    );
    if (results[0].affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "product back to active",
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      message: "Unable to restore product",
    });
  }
});

export default router;
