import { Router } from "express";
import pool from "../../db.js";
const router = Router();

router.get("/overview", async (req, res) => {
  try {
    const [[overview]] = await pool.query(
      `SELECT COALESCE(SUM(TotalPrice), 0) AS TotalRevenue,
              COUNT(*) AS TransactionCount,
              COALESCE(AVG(TotalPrice), 0) AS AverageTransactionValue
       FROM transactions`,
    );
    res.json(overview);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ message: "Unable to load all-time sales overview." });
  }
});

router.get("/", async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({
      message: "Start date and end date are required",
    });
  }
  if (startDate > endDate) {
    return res.status(400).json({
      message: "start date cannot be after end date",
    });
  }

  const start = new Date(startDate + "T12:00:00Z");
  const end = new Date(endDate + "T12:00:00Z");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ message: "Choose valid report dates." });
  }
  start.setUTCDate(start.getUTCDate() - 7);
  end.setUTCDate(end.getUTCDate() - 7);
  const previousStart = start.toISOString().slice(0, 10);
  const previousEnd = end.toISOString().slice(0, 10);

  try {
    const results = await pool.query(
      `SELECT
            SUM(TotalPrice) AS TotalRevenue,
            COUNT(*) AS TransactionCount,
            AVG(TotalPrice) AS AverageTransactionValue
            FROM transactions
            WHERE TransactionDate BETWEEN ? AND ?
            `,
      [startDate, endDate],
    );
    const reportData = results[0];

    if (reportData[0].TotalRevenue === null) {
      reportData[0].TotalRevenue = 0;
    }

    if (reportData[0].AverageTransactionValue === null) {
      reportData[0].AverageTransactionValue = 0;
    }

    const bestProductsResult = await pool.query(
      `
        SELECT i.InventoryID, i.InventoryName,
        SUM(ti.Quantity) AS UnitsSold,
        SUM(ti.Quantity * ti.UnitPrice) AS SalesAmount
        FROM transactionitems AS ti
        JOIN inventory AS i
            ON ti.InventoryID = i.InventoryID
        JOIN transactions AS t
            ON ti.TransactionID = t.TransactionID
        WHERE t.TransactionDate BETWEEN ? AND ?
        GROUP BY i.InventoryID, i.InventoryName
        ORDER BY UnitsSold DESC
        LIMIT 10
        `,
      [startDate, endDate],
    );
    const top10Products = bestProductsResult[0];
    reportData[0].TopProducts = top10Products;

    const dailySalesResult = await pool.query(
      `
        SELECT TransactionDate,
        SUM(TotalPrice) AS TotalRevenue,
        COUNT(*) AS TransactionCount,
        AVG(TotalPrice) AS AverageTransactionValue
        FROM transactions
        WHERE TransactionDate BETWEEN ? AND ?
        GROUP BY TransactionDate
        ORDER BY TransactionDate ASC`,
      [startDate, endDate],
    );
    const dailySales = dailySalesResult[0];
    reportData[0].DailySales = dailySales;

    const [categorySales] = await pool.query(
      `
      SELECT c.CategoryID, c.CategoryName,
      SUM(ti.Quantity * ti.UnitPrice) AS SalesAmount
      FROM transactionitems AS ti
      JOIN inventory AS i
        ON i.InventoryID = ti.InventoryID
      JOIN category AS c
        ON c.CategoryID = i.CategoryID
      JOIN transactions AS t
        ON t.TransactionID = ti.TransactionID
      WHERE t.TransactionDate BETWEEN ? AND ?
      GROUP BY c.CategoryID, c.CategoryName
      ORDER BY SalesAmount DESC
      `,
      [startDate, endDate],
    );

    const [[previousWeek]] = await pool.query(
      `SELECT COALESCE(SUM(TotalPrice), 0) AS TotalRevenue,
              COUNT(*) AS TransactionCount,
              COALESCE(AVG(TotalPrice), 0) AS AverageTransactionValue
       FROM transactions
       WHERE TransactionDate BETWEEN ? AND ?`,
      [previousStart, previousEnd],
    );
    // Transaction dates have day precision, so compare whole calendar days.
    const [promotions] = await pool.query(
      `SELECT p.*, c.CategoryName,
              DATE_FORMAT(GREATEST(p.Starts, ?), '%Y-%m-%d') AS PeriodStart,
              DATE_FORMAT(LEAST(p.Ends, ?, CURDATE()), '%Y-%m-%d') AS PeriodEnd
       FROM (
         SELECT CouponID AS id, 'Coupon' AS OfferType, CouponName AS OfferName,
                CategoryID, DATE(TimeStart) AS Starts, DATE(TimeEnd) AS Ends
         FROM Coupons
       ) AS p
       JOIN Category c ON c.CategoryID = p.CategoryID
       WHERE p.Starts <= LEAST(?, CURDATE()) AND p.Ends >= ?
       ORDER BY p.Starts, p.OfferType, p.id`,
      [startDate, endDate, endDate, startDate],
    );
    for (const promotion of promotions) {
      const periodStart = new Date(promotion.PeriodStart + "T12:00:00Z");
      const periodEnd = new Date(promotion.PeriodEnd + "T12:00:00Z");
      const days = Math.round((periodEnd - periodStart) / 86400000) + 1;
      const beforeStart = new Date(periodStart);
      beforeStart.setUTCDate(beforeStart.getUTCDate() - days);
      const beforeEnd = new Date(periodStart);
      beforeEnd.setUTCDate(beforeEnd.getUTCDate() - 1);
      promotion.BeforeStart = beforeStart.toISOString().slice(0, 10);
      promotion.BeforeEnd = beforeEnd.toISOString().slice(0, 10);
      const [[totals]] = await pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN t.TransactionDate BETWEEN ? AND ?
             THEN ti.Quantity * ti.UnitPrice ELSE 0 END), 0) AS DuringSales,
           COALESCE(SUM(CASE WHEN t.TransactionDate BETWEEN ? AND ?
             THEN ti.Quantity * ti.UnitPrice ELSE 0 END), 0) AS BeforeSales
         FROM TransactionItems ti
         JOIN Inventory i ON i.InventoryID = ti.InventoryID
         JOIN Transactions t ON t.TransactionID = ti.TransactionID
         WHERE i.CategoryID = ? AND t.TransactionDate BETWEEN ? AND ?`,
        [
          promotion.PeriodStart,
          promotion.PeriodEnd,
          promotion.BeforeStart,
          promotion.BeforeEnd,
          promotion.CategoryID,
          promotion.BeforeStart,
          promotion.PeriodEnd,
        ],
      );
      promotion.DuringSales = Number(totals.DuringSales);
      promotion.BeforeSales = Number(totals.BeforeSales);
    }
    reportData[0].Promotions = promotions;
    reportData[0].PreviousWeek = previousWeek;
    reportData[0].PreviousStart = previousStart;
    reportData[0].PreviousEnd = previousEnd;
    reportData[0].CategorySales = categorySales;
    res.json(reportData[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "failed to load sales report",
    });
  }
});

export default router;
