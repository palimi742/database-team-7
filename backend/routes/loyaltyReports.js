import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/test', (req, res) => {
    res.send('Loyalty reports route is working!');
});

router.get('/summary', async (req, res) => {
    try {
        const minPoints = req.query.minPoints;

        const [rows] = await pool.query(
            `SELECT *
             FROM report_loyalty_summary
             WHERE TotalPointsEarned >= ?`,
            [minPoints || 0]
        );

        res.json(rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Unable to fetch report.' });
    }
});

router.get('/locations', async(req, res) => {
    try{
        const [rows] = await pool.query(
            `select * from report_loyalty_locations order by ZipCode`
        );
        res.json(rows);
    }catch (error) {
        console.error('Error fetching loyalty locations:', error.message);
        res.status(500).json({
            message: 'Unable to fetch loyalty location report.'
        });
    }
});

export default router;