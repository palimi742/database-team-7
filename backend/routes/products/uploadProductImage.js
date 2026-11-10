import { raw, Router } from "express";
import pool from "../../db.js";

const router = Router();

router.put(
  "/:inventoryID/image",
  raw({
    type: ["image/jpeg", "image/png", "image/webp"],
    limit: 4_000_000,
  }),
  async (req, res) => {
    const inventoryID = Number(req.params.inventoryID);
    const contentType = req.is("image/jpeg", "image/png", "image/webp");
    const imageData = req.body;

    if (!Number.isSafeInteger(inventoryID) || inventoryID <= 0) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    if (!contentType || !Buffer.isBuffer(imageData) || imageData.length === 0) {
      return res
        .status(400)
        .json({ message: "Choose a JPEG, PNG, or WebP image." });
    }

    const matchesType = {
      "image/jpeg": imageData.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")),
      "image/png": imageData.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
      "image/webp": imageData.toString("latin1", 0, 4) === "RIFF" &&
        imageData.toString("latin1", 8, 12) === "WEBP",
    };
    if (!matchesType[contentType]) {
      return res.status(400).json({ message: "The file contents do not match the image format." });
    }

    const imageURL = `/api/products/${inventoryID}/image`;
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

      await connection.execute(
        `INSERT INTO ProductImages (InventoryID, ContentType, ImageData)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE ContentType = ?, ImageData = ?`,
        [inventoryID, contentType, imageData, contentType, imageData],
      );

      await connection.execute(
        "UPDATE Inventory SET ImageURL = ? WHERE InventoryID = ?",
        [imageURL, inventoryID],
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
