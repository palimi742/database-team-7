import { Router } from "express";
import pool from "../../db.js";
import { createCustomerSession, clearCustomerSession } from "../../auth/customerSession.js";
import { createStaffSession, clearStaffSession } from "../../auth/staffSession.js";

const router = Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body ?? {};
  res.set("Cache-Control", "no-store");

  if (typeof username !== "string" || !username.trim() ||
      typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Enter your username and password." });
  }

  try {
    const [accounts] = await pool.execute(
      `SELECT ca.CustomerID AS id, ca.Username, ca.AccountStatus,
              c.FirstName, c.LastName, NULL AS EmployeeRole
       FROM CustomerAccounts ca
       JOIN Customer c ON c.CustomerID = ca.CustomerID
       WHERE ca.Username = ? AND ca.Password = ?
       UNION ALL
       SELECT ea.EmployeeID, ea.Username, ea.AccountStatus,
              e.FirstName, e.LastName, e.EmployeeRole
       FROM EmployeeAccounts ea
       JOIN Employee e ON e.EmployeeID = ea.EmployeeID
       WHERE ea.Username = ? AND ea.Password = ?`,
      [username.trim(), password, username.trim(), password],
    );

    const activeAccounts = accounts.filter(account => account.AccountStatus === "Active");
    if (activeAccounts.length > 1) {
      return res.status(409).json({
        message: "These credentials match more than one account. Contact FreshMart for assistance.",
      });
    }

    const account = activeAccounts[0];
    if (!account) {
      if (accounts.length === 1 && accounts[0].EmployeeRole === null) {
        clearCustomerSession(res);
        return res.status(403).json({
          code: "ACCOUNT_INACTIVE",
          message: "Your account is marked as inactive. Please contact FreshMart for assistance.",
        });
      }
      return res.status(401).json({ message: "Invalid username or password, or inactive account." });
    }

    const { id, Username, FirstName, LastName, EmployeeRole } = account;
    if (EmployeeRole === null) {
      createCustomerSession(res, id);
      clearStaffSession(res);
      return res.json({ role: "customer", customer: { CustomerID: id, Username, FirstName, LastName } });
    }

    createStaffSession(res, id);
    clearCustomerSession(res);
    const role = EmployeeRole.toLowerCase() === "manager" ? "manager" : "employee";
    return res.json({ role, employee: { EmployeeID: id, Username, FirstName, LastName, EmployeeRole } });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({ message: "Unable to sign in. Please try again." });
  }
});

export default router;
