import { Router } from "express";
import pool from "../../db.js";
import { requireStaff } from "../../auth/staffSession.js";

import { lockEmployee } from "../../auth/employeeShift.js";

const router = Router();
router.use(requireStaff, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/", async (req, res, next) => {
  const employeeId = req.employee.EmployeeID;
  try {
    const [[employee]] = await pool.query(
      "SELECT EmployeePay AS hourlyRate FROM Employee WHERE EmployeeID = ?",
      [employeeId],
    );
    const [[summary]] = await pool.query(
      `SELECT
         COALESCE(SUM(TIMESTAMPDIFF(SECOND,
           GREATEST(ClockInUtc, UTC_TIMESTAMP(6) - INTERVAL 7 DAY), ClockOutUtc)), 0) AS secondsWorked,
         COALESCE(SUM(HourlyRate * TIMESTAMPDIFF(SECOND,
           GREATEST(ClockInUtc, UTC_TIMESTAMP(6) - INTERVAL 7 DAY), ClockOutUtc) / 3600), 0) AS estimatedPay
       FROM EmployeeTimeEntries
       WHERE EmployeeID = ? AND ClockOutUtc > UTC_TIMESTAMP(6) - INTERVAL 7 DAY`,
      [employeeId],
    );
    const [shifts] = await pool.query(
      `SELECT TimeEntryID, HourlyRate,
         DATE_FORMAT(ClockInUtc, '%Y-%m-%dT%H:%i:%sZ') AS ClockIn,
         DATE_FORMAT(ClockOutUtc, '%Y-%m-%dT%H:%i:%sZ') AS ClockOut,
         TIMESTAMPDIFF(SECOND, ClockInUtc, ClockOutUtc) AS SecondsWorked
       FROM EmployeeTimeEntries
       WHERE EmployeeID = ?
       ORDER BY ClockOutUtc IS NULL DESC, ClockInUtc DESC, TimeEntryID DESC
       LIMIT 30`,
      [employeeId],
    );
    res.json({ hourlyRate: employee.hourlyRate, summary, shifts });
  } catch (error) {
    next(error);
  }
});

router.post("/clock-in", async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    await lockEmployee(conn, req.employee.EmployeeID);
    // The unique generated column prevents concurrent open shifts.
    await conn.query(
      `INSERT INTO EmployeeTimeEntries (EmployeeID, ClockInUtc, HourlyRate)
       SELECT EmployeeID, UTC_TIMESTAMP(6), EmployeePay FROM Employee WHERE EmployeeID = ?`,
      [req.employee.EmployeeID],
    );
    await conn.commit();
    res.status(201).json({ message: "You clocked in." });
  } catch (error) {
    if (conn) await conn.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "You already have an open shift." });
    }
    next(error);
  } finally { conn?.release(); }
});

router.post("/clock-out", async (req, res, next) => {
  const timeEntryId = req.body?.timeEntryId;
  if (!Number.isSafeInteger(timeEntryId) || timeEntryId <= 0) {
    return res.status(400).json({ message: "Select a valid open shift." });
  }
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    await lockEmployee(conn, req.employee.EmployeeID);
    const [result] = await conn.query(
      `UPDATE EmployeeTimeEntries
       SET ClockOutUtc = GREATEST(UTC_TIMESTAMP(6), ClockInUtc)
       WHERE OpenEmployeeID = ? AND TimeEntryID = ?`,
      [req.employee.EmployeeID, timeEntryId],
    );
    await conn.commit();
    if (!result.affectedRows) {
      return res.status(409).json({ message: "There is no open shift to clock out of." });
    }
    res.json({ message: "You clocked out." });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally { conn?.release(); }
});

export default router;