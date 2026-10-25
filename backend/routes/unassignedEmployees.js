import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    // Get regular employees who have no orders marked 'Assigned'.
    const result = await pool.query(`
            SELECT EmployeeID, FirstName, LastName
            FROM employee
            WHERE EmployeeRole != 'Manager'
            AND EmployeeID NOT IN (
                SELECT EmployeeID
                FROM orderfulfillment
                WHERE Status = 'Assigned'
                    AND EmployeeID IS NOT NULL)`);
        
    res.json(result[0]);
  } catch (err) {
    console.log("Error loading employees", err.message);
    res.status(500).json({
      message: "Unable to load available employees",
    });
  }
});

export default router;
