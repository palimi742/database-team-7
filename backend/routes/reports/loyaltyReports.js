import { Router } from "express";
import pool from "../../db.js";
import { POINTS_PER_REWARD_DOLLAR } from "../../rewards/redeemPoints.js";

const router = Router();

const fulfillmentJoin = `
  LEFT JOIN OrderFulfillment AS f ON f.FulfillmentID = (
    SELECT MAX(latest.FulfillmentID)
    FROM OrderFulfillment AS latest
    WHERE latest.TransactionID = t.TransactionID
  )
  LEFT JOIN DeliveryType AS d ON d.DeliveryID = f.DeliveryID`;

router.get("/test", (req, res) => {
  res.send("Loyalty reports route is working!");
});

function isTransactionDate(value) {
  if (typeof value !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(value);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

router.get("/orders", async (req, res) => {
  const { from, through } = req.query;
  if (
    !isTransactionDate(from) ||
    !isTransactionDate(through) ||
    from > through
  ) {
    return res.status(400).json({
      message: "Choose valid transaction dates in chronological order.",
    });
  }

  try {
    const [orders] = await pool.query(
      `SELECT t.TransactionID,
                    DATE_FORMAT(t.TransactionDate, '%Y-%m-%d') AS TransactionDate,
                    c.FirstName, c.LastName, t.TotalPrice,
                    t.PointsRedeemed, t.LoyaltyDiscount,
                    d.DeliveryName AS fulfillmentType
             FROM Transactions AS t
             JOIN Customer AS c ON c.CustomerID = t.CustomerID
             ${fulfillmentJoin}
             WHERE t.TransactionDate BETWEEN ? AND ?
             ORDER BY t.TransactionDate DESC, t.TransactionID DESC`,
      [from, through],
    );
    res.json(orders);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Unable to load the loyalty report." });
  }
});

router.get("/orders/:orderId", async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!Number.isSafeInteger(orderId) || orderId < 1) {
    return res.status(400).json({ message: "Invalid order ID." });
  }

  try {
    const [[order]] = await pool.query(
      `SELECT t.TransactionID AS id, t.CustomerID AS customerId,
              DATE_FORMAT(t.TransactionDate, '%Y-%m-%d') AS orderDate,
              t.TotalPrice AS total,
              t.DeliveryFee AS deliveryFee, t.LoyaltyDiscount AS loyaltyDiscount,
              t.PointsEarned AS points, t.PointsRedeemed AS pointsRedeemed,
              c.FirstName AS firstName, c.LastName AS lastName,
              d.DeliveryName AS fulfillmentType, f.DeliveryAddress AS deliveryAddress,
              CASE
                WHEN f.FulfillmentID IS NULL OR f.FulfillmentTime IS NOT NULL THEN 'Completed'
                ELSE f.Status
              END AS status
       FROM Transactions AS t
       JOIN Customer AS c ON c.CustomerID = t.CustomerID
       ${fulfillmentJoin}
       WHERE t.TransactionID = ?`,
      [orderId],
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const [items] = await pool.query(
      `SELECT ti.TransactionItemID AS id, i.InventoryName AS name,
              i.ImageURL AS imageURL, ti.Quantity AS quantity, ti.UnitPrice AS unitPrice
       FROM TransactionItems AS ti
       JOIN Inventory AS i ON i.InventoryID = ti.InventoryID
       WHERE ti.TransactionID = ?
       ORDER BY ti.TransactionItemID`,
      [orderId],
    );
    const subtotalCents = items.reduce(
      (sum, item) =>
        sum + Math.round(Number(item.unitPrice) * 100) * item.quantity,
      0,
    );
    res.json({ ...order, subtotal: subtotalCents / 100, items });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Unable to load the order receipt." });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const minPoints = Number(req.query.minPoints ?? 0);
    if (!Number.isSafeInteger(minPoints) || minPoints < 0) {
      return res.status(400).json({
        message: "Minimum points must be a whole number of zero or more.",
      });
    }

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
      [POINTS_PER_REWARD_DOLLAR, minPoints || 0],
    );

    res.json(
      rows.map((customer) => ({
        ...customer,
        pointsPerRewardDollar: POINTS_PER_REWARD_DOLLAR,
      })),
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Unable to fetch report." });
  }
});

router.get("/locations", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `select * from report_loyalty_locations order by ZipCode`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching loyalty locations:", error.message);
    res.status(500).json({
      message: "Unable to fetch loyalty location report.",
    });
  }
});

export default router;
