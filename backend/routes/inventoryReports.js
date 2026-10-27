import { Router } from 'express';
import pool from '../db.js'

const router = Router();

router.get('/lowStock', async (req, res) => {
    try{
        const [rows] = await pool.query(
           ` select * from low_inventory_report
           order by StockQuantity asc;`
        );

        res.json(rows);
    } catch(error) {
        console.error('Error gettng low inventory:', error.message);
        res.status(500).json({
            message : `Unable to fetch low inventory report`
        });
    }
});

export default router;