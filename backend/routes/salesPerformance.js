import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/", async (req, res) => {
  const { startDate, endDate } = req.query;
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
    const reportFields = results[1];

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
    const dailySales = dailySalesResult[0]
    reportData[0].DailySales = dailySales

    res.json(reportData[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "failed to load sales report",
    });
  }
});

export default router;
