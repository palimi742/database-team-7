import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req,res) => {
    try{
        const[rows] = await pool.query('SELECT InventoryID, SKU, InventoryName, Price FROM Inventory')
        res.json(rows)
    }catch(error){
        console.error("Query Failed", error.message);

        return res.status(500).json({
            message: "Something went wrong with loading products"
        });
    }
});

export default router;
