import { Router } from "express";
import pool from "../../db.js";
import {
  createStaffSession,
  clearStaffSession,
  requireStaff,
} from "../../auth/staffSession.js";

const router = Router();

// Sign in through the existing FreshMart staff login.
router.post("/login", async (req, res) => {
  const { username, password, loginType } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "Please enter your username and password.",
    });
  }

  try {
    const [employees] = await pool.query(
      `SELECT
         e.EmployeeID,
         e.FirstName,
         e.LastName,
         e.EmployeeRole,
         ea.Username
       FROM employeeaccounts ea
       JOIN employee e ON e.EmployeeID = ea.EmployeeID
       WHERE ea.Username = ?
         AND ea.Password = ?
         AND ea.AccountStatus = 'Active'`,
      [username.trim(), password],
    );

    if (employees.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password, or inactive account.",
      });
    }

    const employee = employees[0];
    const isManager =
      String(employee.EmployeeRole).toLowerCase() === "manager";

    if (loginType === "admin" && !isManager) {
      return res.status(403).json({
        message: "Please use Employee Login for this account.",
      });
    }

    if (loginType === "employee" && isManager) {
      return res.status(403).json({
        message: "Please use Manager Login for this account.",
      });
    }

    // Save the verified employee identity in a signed HTTP-only cookie.
    createStaffSession(res, employee.EmployeeID);

    res.set("Cache-Control", "no-store");

    res.json({
      message: "Signed in successfully.",
      employee,
    });
  } catch (error) {
    console.error("Staff login failed:", error.message);

    res.status(500).json({
      message: "Unable to sign in. Please try again.",
    });
  }
});

// Return the employee belonging to the verified staff session.
router.get("/session", requireStaff, (req, res) => {
  res.set("Cache-Control", "no-store");

  res.json({
    employee: req.employee,
  });
});

// Remove the staff login cookie.
router.post("/logout", (req, res) => {
  clearStaffSession(res);
  res.set("Cache-Control", "no-store");

  res.json({
    message: "Signed out successfully.",
  });
});

export default router;