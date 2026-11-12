import { Router } from "express";
import pool from "../db.js";

import requireCustomer from "../auth/requireCustomer.js";

const router = Router();
router.use(requireCustomer);

router.get(["/", "/:customerId"], async (req, res) => {
  const customerId = req.customerId;
  if (req.params.customerId && req.params.customerId !== String(customerId)) {
    return res
      .status(403)
      .json({ message: "You can only access your own rewards." });
  }

  const [rows] = await pool.query(
    "SELECT * from LoyaltyProgram WHERE CustomerID = ?",
    [customerId],
  );
  if (rows.length === 0) {
    return res.json({ isEnrolled: false });
  }
  return res.json({
    isEnrolled: true,
    currentPoints: rows[0].CurrentPoints,
    totalPointsEarned: rows[0].TotalPointsEarned,
    totalPointsRedeemed: rows[0].TotalPointsRedeemed,
  });
});

router.post("/join", async (req, res) => {
  try {
    const customerId = req.customerId;
    const [rows] = await pool.query(
      "SELECT LoyaltyProgramID FROM LoyaltyProgram WHERE CustomerID = ?",
      [customerId],
    );

    if (rows.length > 0) {
      return res.status(409).json({
        message: "Customer is already enrolled in the loyalty program",
      });
    }

    await pool.query(
      `INSERT INTO LoyaltyProgram
        (CustomerID, CurrentPoints, DateJoined, TotalPointsEarned, TotalPointsRedeemed, LastActivityDate)
        VALUES (?, 0, NOW(), 0, 0, NOW())`,
      [customerId],
    );

    return res.status(201).json({
      message: "Successfully joined the loyalty program!",
      isEnrolled: true,
      currentPoints: 0,
    });
  } catch (error) {
    console.error("Joining loyalty program failed:", error.message);
    return res.status(500).json({
      message: "Something went wrong when u were joining Loyalty program",
    });
  }
});

export default router;
