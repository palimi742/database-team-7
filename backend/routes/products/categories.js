import { Router } from "express";
import pool from "../../db.js";
import requireManager from "../auth/requireManager.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT CategoryID, CategoryName, SKUPrefix FROM Category ORDER BY CategoryName",
    );

    res.json(rows);
  } catch (error) {
    console.error("Failed to load categories:", error.message);

    res.status(500).json({
      message: "Unable to load categories.",
    });
  }
});

router.post("/", requireManager, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const prefix =
    typeof req.body?.prefix === "string"
      ? req.body.prefix.trim().toUpperCase()
      : "";

  if (!name || name.length > 100 || !/^[A-Z]{3}$/.test(prefix)) {
    return res.status(400).json({
      message: "Enter a category name and a three-letter SKU prefix.",
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[existingSku]] = await connection.execute(
      "SELECT 1 FROM Inventory WHERE UPPER(SKU) LIKE ? LIMIT 1",
      [`${prefix}-%`],
    );
    if (existingSku) {
      await connection.rollback();
      return res
        .status(409)
        .json({ message: "That prefix is already used by a product SKU." });
    }

    const [result] = await connection.execute(
      "INSERT INTO Category (CategoryName, SKUPrefix) VALUES (?, ?)",
      [name, prefix],
    );
    await connection.execute(
      "INSERT INTO CategorySKUSequence (CategoryID, NextNumber) VALUES (?, 1)",
      [result.insertId],
    );
    await connection.commit();

    return res.status(201).json({
      CategoryID: result.insertId,
      CategoryName: name,
      SKUPrefix: prefix,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        connection.destroy();
        connection = undefined;
        console.error("Category rollback failed:", rollbackError.message);
      }
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "That SKU prefix is already in use." });
    }
    console.error("Failed to add category:", error.message);
    return res.status(500).json({ message: "Unable to add the category." });
  } finally {
    connection?.release();
  }
});

router.patch("/:id", requireManager, async (req, res) => {
  const id = Number(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const prefix =
    typeof req.body?.prefix === "string"
      ? req.body.prefix.trim().toUpperCase()
      : "";

  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !name ||
    name.length > 100 ||
    !/^[A-Z]{3}$/.test(prefix)
  ) {
    return res
      .status(400)
      .json({
        message: "Enter a category name and a three-letter SKU prefix.",
      });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Product creation and category deletion lock this same row.
    const [[counter]] = await connection.execute(
      "SELECT CategoryID FROM CategorySKUSequence WHERE CategoryID = ? FOR UPDATE",
      [id],
    );
    const [[category]] = await connection.execute(
      "SELECT SKUPrefix FROM Category WHERE CategoryID = ? FOR UPDATE",
      [id],
    );
    if (!category) {
      await connection.rollback();
      return res.status(404).json({ message: "Category not found." });
    }
    if (!counter) throw new Error("Category SKU counter is missing.");

    if (prefix !== category.SKUPrefix) {
      const [[existingSku]] = await connection.execute(
        "SELECT 1 FROM Inventory WHERE UPPER(SKU) LIKE ? LIMIT 1",
        [`${prefix}-%`],
      );
      if (existingSku) {
        await connection.rollback();
        return res
          .status(409)
          .json({ message: "That prefix is already used by a product SKU." });
      }
    }

    await connection.execute(
      "UPDATE Category SET CategoryName = ?, SKUPrefix = ? WHERE CategoryID = ?",
      [name, prefix, id],
    );

    if (prefix !== category.SKUPrefix) {
      await connection.execute(
        `UPDATE Inventory
         SET SKU = CONCAT(?, SUBSTRING(SKU, 4))
         WHERE CategoryID = ? AND UPPER(SKU) LIKE ?`,
        [prefix, id, `${category.SKUPrefix}-%`],
      );
    }

    await connection.commit();
    return res.json({ CategoryID: id, CategoryName: name, SKUPrefix: prefix });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        connection.destroy();
        connection = undefined;
        console.error("Category rollback failed:", rollbackError.message);
      }
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "That prefix or a resulting SKU is already in use." });
    }
    console.error("Category update failed:", error.message);
    return res.status(500).json({ message: "Unable to update category." });
  } finally {
    connection?.release();
  }
});

router.delete("/:id", requireManager, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ message: "Choose a category." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [counter] = await connection.execute(
      "DELETE FROM CategorySKUSequence WHERE CategoryID = ? AND NextNumber = 1",
      [id],
    );
    if (!counter.affectedRows) {
      await connection.rollback();
      return res
        .status(409)
        .json({ message: "Only unused categories can be deleted." });
    }
    const [result] = await connection.execute(
      "DELETE FROM Category WHERE CategoryID = ?",
      [id],
    );
    if (!result.affectedRows) {
      await connection.rollback();
      return res.status(404).json({ message: "Category not found." });
    }
    await connection.commit();
    return res.json({ message: "Category deleted." });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        connection.destroy();
        connection = undefined;
        console.error("Category rollback failed:", rollbackError.message);
      }
    }
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(409)
        .json({ message: "This category is linked to existing records." });
    }
    console.error("Category delete failed:", error.message);
    return res.status(500).json({ message: "Unable to delete category." });
  } finally {
    connection?.release();
  }
});

export default router;
