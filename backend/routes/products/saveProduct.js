import { raw, Router } from "express";
import pool from "../../db.js";
import {
  maxProductImageBytes,
  productImageError,
  saveProductImage,
} from "./productImage.js";

const router = Router();

const parseProductForm = raw({
  type: "multipart/form-data",
  limit: maxProductImageBytes + 64_000,
});

router.post(
  "/",
  (req, res, next) => {
    parseProductForm(req, res, (error) => {
      if (error?.status === 413) {
        return res.status(413).json({ message: "Choose an image up to 4 MB." });
      }
      next(error);
    });
  },
  async (req, res) => {
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ message: "A product image is required." });
    }

    let form;
    try {
      form = await new Response(req.body, {
        headers: { "Content-Type": req.get("Content-Type") },
      }).formData();
    } catch {
      return res
        .status(400)
        .json({ message: "Unable to read the product form." });
    }

    const image = form.get("image");
    if (!image || typeof image === "string" || image.size === 0) {
      return res.status(400).json({ message: "A product image is required." });
    }
    const imageData = Buffer.from(await image.arrayBuffer());
    const imageError = productImageError(image.type, imageData);
    if (imageError) return res.status(400).json({ message: imageError });

    const product = Object.fromEntries(form);
    const categoryID = Number(form.get("categoryID"));
    if (!Number.isSafeInteger(categoryID) || categoryID <= 0) {
      return res
        .status(400)
        .json({ message: "Select a category before saving." });
    }

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
        message:
          "Restock target must be a whole number greater than the reorder threshold.",
      });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [[sequence]] = await connection.query(
        `SELECT CAST(NextNumber AS CHAR) AS NextNumber
       FROM CategorySKUSequence WHERE CategoryID = ? FOR UPDATE`,
        [categoryID],
      );
      const [[category]] = await connection.execute(
        "SELECT SKUPrefix FROM Category WHERE CategoryID = ?",
        [categoryID],
      );
      if (!category) {
        await connection.rollback();
        return res
          .status(400)
          .json({
            message:
              "That category was not found. Refresh the product page and select it again.",
          });
      }

      if (!sequence) {
        throw new Error(`SKU counter missing for category ${categoryID}`);
      }

      const sku = `${category.SKUPrefix}-${sequence.NextNumber.padStart(3, "0")}`;
      const [result] = await connection.query(
        `INSERT INTO Inventory
        (SKU, InventoryName, CategoryID, Price, StockQuantity, ReorderThreshold, RestockTargetQuantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sku,
          product.name,
          categoryID,
          product.price,
          product.stockQuantity,
          reorderThreshold,
          restockTargetQuantity,
        ],
      );

      await saveProductImage(
        connection,
        result.insertId,
        image.type,
        imageData,
      );
      await connection.query(
        "UPDATE CategorySKUSequence SET NextNumber = NextNumber + 1 WHERE CategoryID = ?",
        [categoryID],
      );
      await connection.commit();

      res.status(201).json({
        sku,
        message: "Product added to the database successfully",
      });
    } catch (err) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          connection.destroy();
          connection = undefined;
          console.error(
            "Failed to roll back product creation:",
            rollbackError.message,
          );
        }
      }
      if (err.code === "ER_DUP_ENTRY") {
        const detail = err.sqlMessage || err.message || "";

        if (detail.includes("uq_inventory_name")) {
          return res.status(409).json({
            field: "name",
            message: `The product name "${product.name}" already exists. Enter a different name or edit the existing product.`,
          });
        }

        if (detail.includes("uq_inventory_sku")) {
          console.error("Generated SKU already exists:", detail);
          return res.status(409).json({
            message:
              "The generated SKU is already in use. The category counter needs to be checked.",
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
    } finally {
      connection?.release();
    }
  },
);

export default router;
