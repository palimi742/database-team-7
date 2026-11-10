import { Router } from "express";
import pool from "../../db.js";

import requireCustomer from "../../auth/requireCustomer.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT
                CouponID,
                CouponName,
                Description,
                UsesPerClip,
                COALESCE(CategoryID, (
                    SELECT CategoryID FROM CouponCategories
                    WHERE CouponID = Coupons.CouponID LIMIT 1
                )) AS CategoryID,
                UNIX_TIMESTAMP(TimeStart) AS startSeconds,
                UNIX_TIMESTAMP(TimeEnd) AS endSeconds,
                DiscountAmount
            FROM Coupons
            WHERE CURRENT_TIMESTAMP BETWEEN TimeStart AND TimeEnd
        `);
    res.json(
      rows.map(({ startSeconds, endSeconds, ...coupon }) => ({
        ...coupon,
        TimeStart: new Date(startSeconds * 1000).toISOString(),
        TimeEnd: new Date(endSeconds * 1000).toISOString(),
      })),
    );
  } catch (error) {
    console.error("Failed to fetch coupons:", error.message);
    res.status(500).json({
      message: "Unable to load coupons",
    });
  }
});

router.get(
  ["/clipped", "/clipped/:customerID"],
  requireCustomer,
  async (req, res) => {
    try {
      const customerID = req.customerId;
      if (
        req.params.customerID &&
        req.params.customerID !== String(customerID)
      ) {
        return res
          .status(403)
          .json({ message: "You can only access your own coupons." });
      }
      const [rows] = await pool.query(
        `SELECT
                 c.CouponID,
                 c.CouponName,
                 c.DiscountAmount,
                 cc.ClippedAt,
                 cc.UsesRemaining
              FROM ClippedCoupons AS cc
              JOIN Coupons AS c
                  ON cc.CouponID = c.CouponID
              WHERE cc.CustomerID = ?
                AND cc.UsesRemaining > 0
                AND CURRENT_TIMESTAMP BETWEEN c.TimeStart AND c.TimeEnd
              ORDER BY cc.ClippedAt DESC`,
        [customerID],
      );
      res.json(rows);
    } catch (error) {
      console.error("Failed to fetch clipped coupons:", error.message);

      res.status(500).json({
        message: "Unable to load clipped coupons.",
      });
    }
  },
);

router.post("/clip", requireCustomer, async (req, res) => {
  const customerID = req.customerId;
  const couponID = Number(req.body?.couponID);
  if (!Number.isSafeInteger(couponID) || couponID < 1) {
    return res.status(400).json({ message: "A valid coupon ID is required." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(
      "SELECT CustomerID FROM Customer WHERE CustomerID = ? FOR UPDATE",
      [customerID],
    );
    const [[coupon]] = await connection.query(
      `SELECT UsesPerClip FROM Coupons WHERE CouponID = ?
       AND CURRENT_TIMESTAMP BETWEEN TimeStart AND TimeEnd FOR UPDATE`,
      [couponID],
    );
    if (!coupon) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "This coupon is not currently active." });
    }
    const [[clip]] = await connection.query(
      "SELECT UsesRemaining FROM ClippedCoupons WHERE CustomerID = ? AND CouponID = ?",
      [customerID, couponID],
    );
    if (clip?.UsesRemaining > 0) {
      await connection.rollback();
      return res
        .status(409)
        .json({ message: "You already clipped this coupon." });
    }
    await connection.query(
      `INSERT INTO ClippedCoupons (CustomerID, CouponID, UsesRemaining)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE UsesRemaining = ?, ClippedAt = CURRENT_TIMESTAMP`,
      [customerID, couponID, coupon.UsesPerClip, coupon.UsesPerClip],
    );
    await connection.commit();
    res.status(201).json({ UsesRemaining: coupon.UsesPerClip });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Failed to clip coupon:", error.message);
    res.status(500).json({ message: "Unable to clip coupon." });
  } finally {
    connection?.release();
  }
});

export default router;
