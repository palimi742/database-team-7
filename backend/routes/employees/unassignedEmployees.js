import { Router } from "express";
import pool from "../../db.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    // Regular employees can have up to five unfinished orders.
    const result = await pool.query(`
            SELECT EmployeeID, FirstName, LastName
            FROM employee
            WHERE EmployeeRole != 'Manager'
            AND EmployeeID NOT IN (
                SELECT EmployeeID
                FROM orderfulfillment
                WHERE FulfillmentTime IS NULL
                    AND EmployeeID IS NOT NULL
                GROUP BY EmployeeID
                HAVING COUNT(*) >= 5)`);

    res.json(result[0]);
  } catch (err) {
    console.log("Error loading employees", err.message);
    res.status(500).json({
      message: "Unable to load available employees",
    });
  }
});

export default router;
