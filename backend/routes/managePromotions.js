import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/coupons", async (req, res) => {
  try {
    const results = await pool.query(
      `SELECT p.CouponID AS id, p.CategoryID, c.CategoryName,
              p.TimeStart AS startsAt, p.TimeEnd AS endsAt, p.DiscountAmount, p.CouponName
       FROM Coupons AS p
       JOIN Category AS c ON p.CategoryID = c.CategoryID
       ORDER BY p.TimeStart DESC`,
    );
    res.json(results[0]);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to load coupons" });
  }
});

router.post("/coupons", async (req, res) => {
  const promotion = req.body;

  if (
    !promotion.CategoryID ||
    !promotion.DiscountAmount ||
    !promotion.startsAt ||
    !promotion.endsAt
  ) {
    return res
      .status(400)
      .json({
        message: "Category, discount, start time and end time are required",
      });
  }
  if (Number(promotion.DiscountAmount) <= 0) {
    return res
      .status(400)
      .json({ message: "Discount must be greater than zero" });
  }
  if (new Date(promotion.startsAt) >= new Date(promotion.endsAt)) {
    return res
      .status(400)
      .json({ message: "End time must be after start time" });
  }
  if (!promotion.CouponName || !promotion.CouponName.trim()) {
    return res.status(400).json({ message: "Coupon name is required" });
  }

  try {
    const existing = await pool.query(
      `SELECT CouponID FROM Coupons
       WHERE CategoryID = ? AND TimeStart <= ? AND TimeEnd >= ?`,
      [
        promotion.CategoryID,
        new Date(promotion.endsAt),
        new Date(promotion.startsAt),
      ],
    );
    if (existing[0].length > 0) {
      return res
        .status(400)
        .json({
          message: "Another offer in this category already uses these dates",
        });
    }

    await pool.query(
      `INSERT INTO Coupons (CategoryID, TimeStart, TimeEnd, DiscountAmount, CouponName)
       VALUES (?, ?, ?, ?, ?)`,
      [
        promotion.CategoryID,
        new Date(promotion.startsAt),
        new Date(promotion.endsAt),
        promotion.DiscountAmount,
        promotion.CouponName,
      ],
    );
    res.status(201).json({ message: "Coupon added" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to add coupon" });
  }
});

router.put("/coupons/:id", async (req, res) => {
  const promotion = req.body;
  const promotionID = Number(req.params.id);

  if (!Number.isInteger(promotionID) || promotionID <= 0) {
    return res.status(400).json({ message: "Invalid promotion ID" });
  }

  if (
    !promotion.CategoryID ||
    !promotion.DiscountAmount ||
    !promotion.startsAt ||
    !promotion.endsAt
  ) {
    return res
      .status(400)
      .json({
        message: "Category, discount, start time and end time are required",
      });
  }
  if (Number(promotion.DiscountAmount) <= 0) {
    return res
      .status(400)
      .json({ message: "Discount must be greater than zero" });
  }
  if (new Date(promotion.startsAt) >= new Date(promotion.endsAt)) {
    return res
      .status(400)
      .json({ message: "End time must be after start time" });
  }
  if (!promotion.CouponName || !promotion.CouponName.trim()) {
    return res.status(400).json({ message: "Coupon name is required" });
  }

  try {
    const existing = await pool.query(
      `SELECT CouponID FROM Coupons
       WHERE CategoryID = ? AND TimeStart <= ? AND TimeEnd >= ? AND CouponID <> ?`,
      [
        promotion.CategoryID,
        new Date(promotion.endsAt),
        new Date(promotion.startsAt),
        promotionID,
      ],
    );
    if (existing[0].length > 0) {
      return res
        .status(400)
        .json({
          message: "Another offer in this category already uses these dates",
        });
    }

    const results = await pool.query(
      `UPDATE Coupons
       SET CategoryID = ?, TimeStart = ?, TimeEnd = ?, DiscountAmount = ?, CouponName = ?,
           TableUpdateTime = CURRENT_TIMESTAMP
       WHERE CouponID = ?`,
      [
        promotion.CategoryID,
        new Date(promotion.startsAt),
        new Date(promotion.endsAt),
        promotion.DiscountAmount,
        promotion.CouponName,
        promotionID,
      ],
    );
    if (results[0].affectedRows === 0) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json({ message: "Coupon updated" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to update coupon" });
  }
});

router.delete("/coupons/:id", async (req, res) => {
  const promotionID = Number(req.params.id);

  if (!Number.isInteger(promotionID) || promotionID <= 0) {
    return res.status(400).json({ message: "Invalid promotion ID" });
  }
  try {
    const results = await pool.query(`DELETE FROM Coupons WHERE CouponID = ?`, [
      promotionID,
    ]);
    if (results[0].affectedRows === 0) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to delete coupon" });
  }
});

router.get("/sales", async (req, res) => {
  try {
    const results = await pool.query(
      `SELECT p.SeasonalSalesID AS id, p.CategoryID, c.CategoryName,
              p.SalesStart AS startsAt, p.SalesEnd AS endsAt, p.DiscountAmount
       FROM SeasonalSales AS p
       JOIN Category AS c ON p.CategoryID = c.CategoryID
       ORDER BY p.SalesStart DESC`,
    );
    res.json(results[0]);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to load sales" });
  }
});

router.post("/sales", async (req, res) => {
  const promotion = req.body;

  if (
    !promotion.CategoryID ||
    !promotion.DiscountAmount ||
    !promotion.startsAt ||
    !promotion.endsAt
  ) {
    return res
      .status(400)
      .json({
        message: "Category, discount, start time and end time are required",
      });
  }
  if (Number(promotion.DiscountAmount) <= 0) {
    return res
      .status(400)
      .json({ message: "Discount must be greater than zero" });
  }
  if (new Date(promotion.startsAt) >= new Date(promotion.endsAt)) {
    return res
      .status(400)
      .json({ message: "End time must be after start time" });
  }

  try {
    const existing = await pool.query(
      `SELECT SeasonalSalesID FROM SeasonalSales
       WHERE CategoryID = ? AND SalesStart <= ? AND SalesEnd >= ?`,
      [
        promotion.CategoryID,
        new Date(promotion.endsAt),
        new Date(promotion.startsAt),
      ],
    );
    if (existing[0].length > 0) {
      return res
        .status(400)
        .json({
          message: "Another offer in this category already uses these dates",
        });
    }

    await pool.query(
      `INSERT INTO SeasonalSales (CategoryID, SalesStart, SalesEnd, DiscountAmount)
       VALUES (?, ?, ?, ?)`,
      [
        promotion.CategoryID,
        new Date(promotion.startsAt),
        new Date(promotion.endsAt),
        promotion.DiscountAmount,
      ],
    );
    res.status(201).json({ message: "Sale added" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to add sale" });
  }
});

router.put("/sales/:id", async (req, res) => {
  const promotion = req.body;
  const promotionID = Number(req.params.id);

  if (!Number.isInteger(promotionID) || promotionID <= 0) {
    return res.status(400).json({ message: "Invalid promotion ID" });
  }

  if (
    !promotion.CategoryID ||
    !promotion.DiscountAmount ||
    !promotion.startsAt ||
    !promotion.endsAt
  ) {
    return res
      .status(400)
      .json({
        message: "Category, discount, start time and end time are required",
      });
  }
  if (Number(promotion.DiscountAmount) <= 0) {
    return res
      .status(400)
      .json({ message: "Discount must be greater than zero" });
  }
  if (new Date(promotion.startsAt) >= new Date(promotion.endsAt)) {
    return res
      .status(400)
      .json({ message: "End time must be after start time" });
  }

  try {
    const existing = await pool.query(
      `SELECT SeasonalSalesID FROM SeasonalSales
       WHERE CategoryID = ? AND SalesStart <= ? AND SalesEnd >= ? AND SeasonalSalesID <> ?`,
      [
        promotion.CategoryID,
        new Date(promotion.endsAt),
        new Date(promotion.startsAt),
        promotionID,
      ],
    );
    if (existing[0].length > 0) {
      return res
        .status(400)
        .json({
          message: "Another offer in this category already uses these dates",
        });
    }

    const results = await pool.query(
      `UPDATE SeasonalSales
       SET CategoryID = ?, SalesStart = ?, SalesEnd = ?, DiscountAmount = ?,
           TableUpdateTime = CURRENT_TIMESTAMP
       WHERE SeasonalSalesID = ?`,
      [
        promotion.CategoryID,
        new Date(promotion.startsAt),
        new Date(promotion.endsAt),
        promotion.DiscountAmount,
        promotionID,
      ],
    );
    if (results[0].affectedRows === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }
    res.json({ message: "Sale updated" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to update sale" });
  }
});

router.delete("/sales/:id", async (req, res) => {
  const promotionID = Number(req.params.id);

  if (!Number.isInteger(promotionID) || promotionID <= 0) {
    return res.status(400).json({ message: "Invalid promotion ID" });
  }
  try {
    const results = await pool.query(
      `DELETE FROM SeasonalSales WHERE SeasonalSalesID = ?`,
      [promotionID],
    );
    if (results[0].affectedRows === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }
    res.json({ message: "Sale deleted" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to delete sale" });
  }
});

export default router;
