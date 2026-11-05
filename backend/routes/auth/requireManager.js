import pool from "../../db.js";
import { readStaffSession } from "../../auth/staffSession.js";

function denyAccess(req, res, status, message) {
  // Only document navigation gets a page redirect; fetch requests keep JSON.
  if (req.method === "GET" && req.get("Sec-Fetch-Mode") === "navigate") {
    const notice = status === 403 ? "manager-required" : "signin-required";
    return res.redirect(303, `/manager/login?notice=${notice}`);
  }
  return res.status(status).json({ message });
}

export default async function requireManager(req, res, next) {
  res.set("Cache-Control", "no-store");

  try {
    const employeeId = readStaffSession(req);
    if (!employeeId) {
      return denyAccess(req, res, 401, "Please sign in.");
    }
    const [rows] = await pool.query(
      `
            SELECT e.EmployeeID, e.EmployeeRole
            From employee AS e
            JOIN employeeaccounts ea ON ea.EmployeeID = e.EmployeeID
            WHERE e.EmployeeID = ? AND ea.AccountStatus = 'Active'
            `,
      [employeeId],
    );
    if (!rows.length) {
      return denyAccess(req, res, 401, "Please sign in again.");
    }

    const employee = rows[0];

    if (employee.EmployeeRole.toLowerCase() !== "manager") {
      return denyAccess(req, res, 403, "Manager access required.");
    }
    req.employee = employee;
    next();
  } catch (err) {
    next(err);
  }
}
