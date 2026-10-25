
import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                i.InventoryID,
                i.InventoryName,
                i.CategoryID,
                i.Price,
                ss.DiscountAmount,
                ss.SalesStart,
                ss.SalesEnd
            FROM Inventory AS i
            LEFT JOIN SeasonalSales AS ss
                ON i.CategoryID = ss.CategoryID
                AND CURRENT_TIMESTAMP BETWEEN ss.SalesStart AND ss.SalesEnd
            ORDER BY i.InventoryName;
        `);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching seasonal sales:', error);

        res.status(500).json({
            message: 'Failed to load seasonal sales.'
        });
    }
});

export default router;
