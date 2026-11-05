import pool from "../db.js";
import { clearCustomerSession, readCustomerSession } from "./customerSession.js";

// Recheck status on every protected request, including previously issued cookies.
export async function activeCustomerId(req, res, db = pool) {
  const customerId = readCustomerSession(req);
  if (!customerId) return null;
  const [rows] = await db.query(
    "SELECT CustomerID FROM CustomerAccounts WHERE CustomerID = ? AND AccountStatus = 'Active'",
    [customerId],
  );
  if (rows.length) return customerId;
  clearCustomerSession(res);
  return null;
}

export default async function requireCustomer(req, res, next) {
  res.set("Cache-Control", "no-store");
  try {
    req.customerId = await activeCustomerId(req, res);
    if (!req.customerId) {
      return res.status(401).json({ message: "Please sign in with an active customer account." });
    }
    next();
  } catch (error) {
    next(error);
  }
}
