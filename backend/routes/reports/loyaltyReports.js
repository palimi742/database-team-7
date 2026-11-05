import { Router } from 'express';
import pool from '../../db.js';
import { POINTS_PER_REWARD_DOLLAR } from '../../rewards/redeemPoints.js';

const router = Router();

router.get('/test', (req, res) => {
    res.send('Loyalty reports route is working!');
});

router.get('/summary', async (req, res) => {
    try {
        const minPoints = req.query.minPoints;

        const [rows] = await pool.query(
            `SELECT summary.*,
                    COALESCE(summary.TotalPointsRedeemed, 0) / ? AS loyaltySavings,
                    COALESCE(savings.couponSavings, 0) AS couponSavings,
                    COALESCE(savings.couponsUsed, 0) AS couponsUsed
             FROM report_loyalty_summary AS summary
             LEFT JOIN (
                 SELECT used.CustomerID, COUNT(*) AS couponsUsed,
                        SUM(coupon.DiscountAmount) AS couponSavings
                 FROM UsedCoupons AS used
                 JOIN Coupons AS coupon ON coupon.CouponID = used.CouponID
                 WHERE used.Used = TRUE
                 GROUP BY used.CustomerID
             ) AS savings ON savings.CustomerID = summary.CustomerID
             WHERE summary.TotalPointsEarned >= ?`,
            [POINTS_PER_REWARD_DOLLAR, minPoints || 0]
        );

        res.json(rows.map((customer) => ({
            ...customer,
            pointsPerRewardDollar: POINTS_PER_REWARD_DOLLAR,
        })));
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