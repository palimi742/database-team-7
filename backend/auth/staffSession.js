import crypto from "node:crypto";
import pool from "../db.js";

const COOKIE_NAME = "freshmart_staff";
const SESSION_SECONDS = 8 * 60 * 60;

// Use the existing SESSION_SECRET environment variable.
function getSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Set the SESSION_SECRET environment variable.");
  }

  return "freshmart-development-staff-secret";
}

// Sign staff sessions separately from customer sessions.
function sign(payload) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`staff:${payload}`)
    .digest("hex");
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

// Called after a successful employee or manager login.
export function createStaffSession(res, employeeId) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${employeeId}.${expires}`;

  res.cookie(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    ...cookieOptions(),
    maxAge: SESSION_SECONDS * 1000,
  });
}

// Called when the employee signs out.
export function clearStaffSession(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

// Verify the cookie and return the authenticated employee ID.
export function readStaffSession(req) {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return null;

  const parts = cookie.slice(COOKIE_NAME.length + 1).split(".");

  if (parts.length !== 3) return null;

  const [id, expires, signature] = parts;

  if (!/^[1-9]\d*$/.test(id) || !/^\d+$/.test(expires)) {
    return null;
  }

  const employeeId = Number(id);
  const expiryTime = Number(expires);

  if (
    !Number.isSafeInteger(employeeId) ||
    !Number.isSafeInteger(expiryTime) ||
    expiryTime <= Date.now() / 1000
  ) {
    return null;
  }

  const expected = Buffer.from(sign(`${id}.${expires}`));
  const supplied = Buffer.from(signature);

  if (
    expected.length !== supplied.length ||
    !crypto.timingSafeEqual(expected, supplied)
  ) {
    return null;
  }

  return employeeId;
}

// Protect backend routes and load the current employee.
// Never trust an employee ID supplied by the webpage.
export async function requireStaff(req, res, next) {
  try {
    const employeeId = readStaffSession(req);

    if (!employeeId) {
      return res.status(401).json({
        message: "Please sign in with your staff account.",
      });
    }

    const [employees] = await pool.query(
      `SELECT
         e.EmployeeID,
         e.FirstName,
         e.LastName,
         e.EmployeeRole
       FROM employee e
       WHERE e.EmployeeID = ?
         AND EXISTS (
           SELECT 1
           FROM employeeaccounts ea
           WHERE ea.EmployeeID = e.EmployeeID
             AND ea.AccountStatus = 'Active'
         )`,
      [employeeId],
    );

    if (employees.length === 0) {
      clearStaffSession(res);

      return res.status(401).json({
        message: "Your staff account is unavailable. Please sign in again.",
      });
    }

    req.employee = employees[0];
    next();
  } catch (error) {
    console.error("Staff session check failed:", error.message);

    res.status(500).json({
      message: "Unable to verify your staff session.",
    });
  }
}

// Use after requireStaff for manager-only actions.
export function requireManager(req, res, next) {
  if (
    !req.employee ||
    String(req.employee.EmployeeRole).toLowerCase() !== "manager"
  ) {
    return res.status(403).json({
      message: "Only managers can access this feature.",
    });
  }

  next();
}
