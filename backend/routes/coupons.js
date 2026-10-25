import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
    try{
        const [rows] = await pool.query(`
            SELECT
                CouponID,
                CouponName,
                CategoryID,
                TimeStart,
                TimeEnd,
                DiscountAmount
            FROM Coupons
            WHERE CURRENT_TIMESTAMP BETWEEN TimeStart AND TimeEnd
        `);
        res.json(rows);
    } catch (error) {
        console.error('Failed to fetch coupons:', error.message);
        res.status(500).json({
            message: 'Unable to load coupons'
        });
    }
});

router.get('/clipped/:customerID', async (req, res) => {
    try {
        const { customerID } = req.params;
        const [rows] = await pool.query(
             `SELECT
                 c.CouponID,
                 c.CouponName,
                 c.DiscountAmount,
                 cc.ClippedAt
              FROM ClippedCoupons AS cc
              JOIN Coupons AS c
                  ON cc.CouponID = c.CouponID
              WHERE cc.CustomerID = ?
              ORDER BY cc.ClippedAt DESC`,
              [customerID]
        );
        res.json(rows);

    } catch (error) {
        console.error('Failed to fetch clipped coupons:', error.message);

        res.status(500).json({
            message: 'Unable to load clipped coupons.'
         });
    }
});



router.post('/clip', async (req, res) => {
try{
    const {customerID, couponID} = req.body;
    if (!customerID || !couponID) {
    return res.status(400).json({
        message: 'Customer ID and coupon ID are required.'
    });
}
    const [existing] = await pool.query(
        `SELECT ClippedCouponID
        FROM ClippedCoupons
        WHERE CustomerID = ? AND CouponID = ?`,
        [customerID, couponID]
    )
    if(existing.length > 0){
        return res.status(409).json({
            message: 'You already clipped this coupon'
        })
    }
    const [coupons] = await pool.query(
        `SELECT CouponID
        FROM Coupons
        WHERE CouponID = ?
            AND CURRENT_TIMESTAMP BETWEEN TimeStart AND TimeEnd`,
        [couponID]
    );
    if (coupons.length === 0) {
    return res.status(400).json({
        message: 'This coupon is not currently active.'
    });
    }
    await pool.query(
    `INSERT INTO ClippedCoupons (CustomerID, CouponID)
     VALUES (?, ?)`,
    [customerID, couponID]
    );
    return res.status(201).json({
    message: 'Coupon clipped successfully!'
    });
}catch(error) {
     console.error('Failed to clip coupon:', error.message);

    return res.status(500).json({
        message: 'Unable to clip coupon.'
    });
}
});


export default router;