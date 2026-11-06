import { Router } from "express";
import pool from "../../db.js";

const router = Router();

// Mounted under the existing manager-only product middleware.
router.patch("/:productId/restock", async (req, res) => {
  const productId = Number(req.params.productId);
  const quantity = req.body?.quantity;
  if (!Number.isSafeInteger(productId) || productId <= 0 ||
      !Number.isInteger(quantity) || quantity <= 0 || quantity > 2147483647) {
    return res.status(400).json({ message: "Enter a valid product and a positive whole quantity." });
  }
  try {
    const [result] = await pool.query(
      `UPDATE Inventory SET StockQuantity = StockQuantity + ?, TableUpdateTime = CURRENT_TIMESTAMP
       WHERE InventoryID = ? AND IsActive = TRUE AND StockQuantity <= 2147483647 - ?`,
      [quantity, productId, quantity],
    );
    if (result.affectedRows !== 1) {
      return res.status(409).json({ message: "Unable to restock. The product may be inactive or the quantity is too large." });
    }
    res.json({ message: "Stock received. Inventory updated." });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Unable to restock this product." });
  }
});

export default router;
