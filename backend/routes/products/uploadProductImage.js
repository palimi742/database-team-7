import { raw, Router } from "express";
import pool from "../../db.js";
import {
  maxProductImageBytes,
  productImageError,
  saveProductImage,
} from "./productImage.js";

const router = Router();

router.put(
  "/:inventoryID/image",
  raw({
    type: ["image/jpeg", "image/png", "image/webp"],
    limit: maxProductImageBytes,
  }),
  async (req, res) => {
    const inventoryID = Number(req.params.inventoryID);
    const contentType = req.is("image/jpeg", "image/png", "image/webp");
    const imageData = req.body;

    if (!Number.isSafeInteger(inventoryID) || inventoryID <= 0) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const imageError = productImageError(contentType, imageData);
    if (imageError) return res.status(400).json({ message: imageError });

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [products] = await connection.execute(
        "SELECT InventoryID FROM Inventory WHERE InventoryID = ? FOR UPDATE",
        [inventoryID],
      );

      if (products.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "Product not found." });
      }

      const imageURL = await saveProductImage(
        connection,
        inventoryID,
        contentType,
        imageData,
      );
      await connection.commit();
      return res.json({ message: "Image saved.", imageURL });
    } catch (error) {
      if (connection) await connection.rollback().catch(console.error);
      console.error("Image save failed:", error.message);
      return res.status(500).json({ message: "Unable to save the image." });
    } finally {
      connection?.release();
    }
  },
);

export default router;
