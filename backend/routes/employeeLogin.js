import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password, loginType } = req.body;
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return res.status(400).json({ message: "Please enter your username and password." });
  }

  try {
    const results = await pool.query(
      `SELECT e.EmployeeID, e.FirstName, e.LastName, e.EmployeeRole, ea.Username
       FROM employeeaccounts ea
       JOIN employee e ON e.EmployeeID = ea.EmployeeID
       WHERE ea.Username = ? AND ea.Password = ? AND ea.AccountStatus = 'Active'`,
      [username.trim(), password]
    );
    const employees = results[0];
    if (employees.length === 0) {
      return res.status(401).json({ message: "Invalid username or password, or inactive account." });
    }
    const isManager = employees[0].EmployeeRole.toLowerCase() === "manager";
    if (loginType === "admin" && !isManager) {
      return res.status(403).json({ message: "Please use Employee Login for this account." });
    }
    if (loginType === "employee" && isManager) {
      return res.status(403).json({ message: "Please use Admin Login for this account." });
    }
    res.json({ message: "Signed in successfully.", employee: employees[0] });
  } catch (err) {
    console.error("Staff login failed:", err.message);
    res.status(500).json({ message: "Unable to sign in. Please try again." });
  }
});

export default router;
