import { Router } from "express";
import pool from "../../db.js";
const router = Router();

function isReportDate(value) {
  if (typeof value !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(value + "T00:00:00Z");
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

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

  if (![startDate, endDate].every(isReportDate)) {
    return res.status(400).json({ message: "Choose valid report dates." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT TransactionID,
              DATE_FORMAT(TransactionDate, '%Y-%m-%d') AS TransactionDate,
              TotalPrice,
              c.FirstName, c.LastName,
              SUM(TotalPrice) OVER () AS TotalRevenue,
              COUNT(*) OVER () AS TransactionCount,
              AVG(TotalPrice) OVER () AS AverageTransactionValue
       FROM transactions AS t
       JOIN Customer AS c ON c.CustomerID = t.CustomerID
       WHERE TransactionDate BETWEEN ? AND ?
       ORDER BY TransactionDate DESC, TransactionID DESC`,
      [startDate, endDate],
    );
    const summary = rows[0];
    const report = {
      TotalRevenue: summary?.TotalRevenue ?? 0,
      TransactionCount: summary?.TransactionCount ?? 0,
      AverageTransactionValue: summary?.AverageTransactionValue ?? 0,
      Transactions: rows.map(
        ({
          TransactionID,
          TransactionDate,
          TotalPrice,
          FirstName,
          LastName,
        }) => ({
          TransactionID,
          TransactionDate,
          TotalPrice,
          FirstName,
          LastName,
        }),
      ),
    };

    const dailySalesResult = await pool.query(
      `
        SELECT TransactionDate,
        SUM(TotalPrice) AS TotalRevenue,
        COUNT(*) AS TransactionCount,
        AVG(TotalPrice) AS AverageTransactionValue
        FROM transactions
        WHERE TransactionDate BETWEEN ? AND ?
        GROUP BY TransactionDate
        ORDER BY TotalRevenue DESC, TransactionDate ASC
        LIMIT 5`,
      [startDate, endDate],
    );
    report.DailySales = dailySalesResult[0];

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

    report.CategorySales = categorySales;
    res.json(report);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "failed to load sales report",
    });
  }
});

export default router;
