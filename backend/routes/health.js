import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS test');
        res.send(`MySQL connected! Test result: ${rows[0].test}`);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        res.status(500).send('Database connection failed.');
    }
});

router.get('/api/health', (req, res) => res.json({ status: 'ok' }));

export default router;
