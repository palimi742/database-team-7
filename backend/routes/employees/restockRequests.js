import { Router } from "express";
import pool from "../../db.js";
import { requireStaff } from "../../auth/staffSession.js";

const router = Router();

// All requests require a verified staff login.
router.use(requireStaff);

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// View only the signed-in employee's requests.
router.get("/", async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT
         r.RequestID,
         r.InventoryID,
         i.InventoryName,
         i.SKU,
         r.RequestedQuantity,
         r.StockAtRequest,
         r.EmployeeNote,
         r.Status,
         r.CreatedAt,
         r.ReviewedAt,
         r.ManagerNote,
         r.FulfilledAt,
         reviewer.FirstName AS ManagerFirstName,
         reviewer.LastName AS ManagerLastName
       FROM RestockRequests r
       JOIN Inventory i ON i.InventoryID = r.InventoryID
       LEFT JOIN Employee reviewer
         ON reviewer.EmployeeID = r.ReviewedByEmployeeID
       WHERE r.RequestedByEmployeeID = ?
       ORDER BY r.CreatedAt DESC, r.RequestID DESC`,
      [req.employee.EmployeeID],
    );

    res.json({ requests });
  } catch (error) {
    console.error("Loading restock requests failed:", error.message);

    res.status(500).json({
      message: "Unable to load your restock requests.",
    });
  }
});

// Submit a request for a low-stock or out-of-stock product.
router.post("/", async (req, res) => {
  const { inventoryId, note = "" } = req.body ?? {};

  // Expect numbers from the frontend.
  if (!Number.isSafeInteger(inventoryId) || inventoryId <= 0) {
    return res.status(400).json({
      message: "Please select a valid product.",
    });
  }

  if (typeof note !== "string" || note.trim().length > 500) {
    return res.status(400).json({
      message: "Your note must be 500 characters or fewer.",
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lock the product while checking stock and saving the request.
    const [products] = await connection.query(
      `SELECT InventoryID, StockQuantity, ReorderThreshold
       FROM Inventory
       WHERE InventoryID = ? AND IsActive = TRUE
       FOR UPDATE`,
      [inventoryId],
    );

    if (products.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const stock = Number(products[0].StockQuantity);

    const requestedQuantity = Number(products[0].ReorderThreshold) - stock;

    if (requestedQuantity <= 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "This product is already at or above its reorder threshold.",
      });
    }

    const [existing] = await connection.query(
      `SELECT RequestID
       FROM RestockRequests
       WHERE OpenInventoryID = ?
       FOR UPDATE`,
      [inventoryId],
    );

    if (existing.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "This product already has a pending or approved restock request.",
      });
    }

    const [result] = await connection.query(
      `INSERT INTO RestockRequests (
         InventoryID,
         RequestedByEmployeeID,
         RequestedQuantity,
         StockAtRequest,
         EmployeeNote
       )
       VALUES (?, ?, ?, ?, ?)`,
      [
        inventoryId,
        req.employee.EmployeeID,
        requestedQuantity,
        stock,
        note.trim() || null,
      ],
    );

    await connection.commit();

    res.status(201).json({
      message: "Restock request submitted for manager approval.",
      requestId: result.insertId,
      requestedQuantity,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Restock rollback failed:", rollbackError.message);
      }
    }

    // The database unique constraint also prevents simultaneous duplicates.
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "This product already has a pending or approved restock request.",
      });
    }

    console.error("Creating restock request failed:", error.message);

    res.status(500).json({
      message: "Unable to submit your restock request.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
