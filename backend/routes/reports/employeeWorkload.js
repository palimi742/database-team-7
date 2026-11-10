import { Router } from "express";
import pool from "../../db.js";

function isReportDate(value) {
  if (typeof value !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const router = Router();
router.get("/", async (req, res) => {
  const { hiredSince, asOf } = req.query;
  if (!isReportDate(hiredSince) || !isReportDate(asOf) || hiredSince > asOf) {
    return res.status(400).json({
      message: "Provide valid hire dates with the start on or before the end.",
    });
  }

  try {
    const [employees] = await pool.query(
      `SELECT e.EmployeeID, e.FirstName, e.LastName, e.EmployeeRole, e.EmployeePay,
              DATE_FORMAT(e.EmployeeHireDate, '%Y-%m-%d') AS EmployeeHireDate,
              COALESCE((
                SELECT SUM(
                  CASE WHEN s.EndTime < s.StartTime THEN 86400 ELSE 0 END
                  + TIME_TO_SEC(s.EndTime) - TIME_TO_SEC(s.StartTime)
                )
                FROM WorkSchedule s
                WHERE s.EmployeeID = e.EmployeeID
              ), 0) AS WeeklyScheduledSeconds
       FROM Employee e
       WHERE e.EmployeeHireDate BETWEEN ? AND ?
       ORDER BY e.EmployeeHireDate DESC, e.EmployeeID`,
      [hiredSince, asOf],
    );

    res.json({ employees });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to load employee report." });
  }
});

export default router;
