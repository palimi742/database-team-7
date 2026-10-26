
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT CategoryID, CategoryName FROM Category ORDER BY CategoryName'
    );

    res.json(rows);
  } catch (error) {
    console.error('Failed to load categories:', error.message);

    res.status(500).json({
      message: 'Unable to load categories.'
    });
  }
});

export default router;
