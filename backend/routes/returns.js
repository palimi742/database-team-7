import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const results = await pool.query(`
      SELECT *
      FROM ProductReturns
      WHERE Status = 'Pending'
      ORDER BY ReturnDate
    `);

    res.json(results[0]);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      message: "Unable to load return requests",
    });
  }
});

router.patch("/:returnID/approve", async (req, res) => {
  const returnID = Number(req.params.returnID);

  if (!Number.isInteger(returnID) || returnID <= 0) {
    return res.status(400).json({
      message: "Invalid return ID",
    });
  }

  try {
    const results = await pool.query(
      `SELECT r.TransactionItemID, r.QuantityReturned,
              ti.Quantity, ti.UnitPrice
       FROM ProductReturns AS r
       JOIN TransactionItems AS ti
         ON r.TransactionItemID = ti.TransactionItemID
       WHERE r.ReturnID = ?
         AND r.Status = 'Pending'`,
      [returnID],
    );

    if (results[0].length === 0) {
      return res.status(400).json({
        message: "Pending return request not found",
      });
    }

    const request = results[0][0];

    const previousResults = await pool.query(
      `SELECT QuantityReturned
       FROM ProductReturns
       WHERE TransactionItemID = ?
         AND Status = 'Approved'`,
      [request.TransactionItemID],
    );

    let totalReturned = Number(request.QuantityReturned);

    for (const previousReturn of previousResults[0]) {
      totalReturned += Number(previousReturn.QuantityReturned);
    }

    if (request.QuantityReturned <= 0 || totalReturned > request.Quantity) {
      return res.status(400).json({
        message: "Return quantity exceeds the purchased quantity",
      });
    }

    const refund = request.QuantityReturned * Number(request.UnitPrice);

    const updateResults = await pool.query(
      `UPDATE ProductReturns
       SET Status = 'Approved',
           RefundTotal = ?,
           TableUpdateTime = NOW()
       WHERE ReturnID = ?
         AND Status = 'Pending'`,
      [refund, returnID],
    );

    if (updateResults[0].affectedRows === 0) {
      return res.status(400).json({
        message: "Request has already been reviewed",
      });
    }

    res.json({
      message: "Return request approved",
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      message: "Unable to approve return request",
    });
  }
});

router.patch("/:returnID/decline", async (req, res) => {
  const returnID = Number(req.params.returnID);

  if (!Number.isInteger(returnID) || returnID <= 0) {
    return res.status(400).json({
      message: "Invalid return ID",
    });
  }

  try {
    const results = await pool.query(
      `UPDATE ProductReturns
       SET Status = 'Declined',
           TableUpdateTime = NOW()
       WHERE ReturnID = ?
         AND Status = 'Pending'`,
      [returnID],
    );

    if (results[0].affectedRows === 0) {
      return res.status(400).json({
        message: "Pending return request not found",
      });
    }

    res.json({
      message: "Return request declined",
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      message: "Unable to decline return request",
    });
  }
});

export default router;
