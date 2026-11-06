import { Router } from "express";
import pool from "../../db.js";
import {
  createCustomerSession,
  clearCustomerSession,
} from "../../auth/customerSession.js";

import requireCustomer from "../../auth/requireCustomer.js";

const router = Router();

// Identity comes from the verified cookie, never a customer ID in the form.
router.use("/profile", requireCustomer);

router.get("/profile", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT CustomerID, FirstName, LastName, PhoneNumber, CustomerAddress
     FROM Customer WHERE CustomerID = ?`,
    [req.customerId],
  );
  if (!rows.length) return res.status(404).json({ message: "Customer not found." });
  res.json(rows[0]);
});

router.post("/profile/deactivate", async (req, res) => {
  await pool.query(
    `UPDATE CustomerAccounts SET AccountStatus = 'Inactive'
     WHERE CustomerID = ?`,
    [req.customerId],
  );
  clearCustomerSession(res);
  res.set("Cache-Control", "no-store");
  res.json({ message: "Your account is now inactive." });
});

router.put("/profile", async (req, res) => {
  const { FirstName, LastName, PhoneNumber, CustomerAddress } = req.body || {};
  const fields = [FirstName, LastName, PhoneNumber, CustomerAddress];
  const limits = [100, 100, 50, 150];
  if (fields.some((value, index) =>
    typeof value !== "string" || !value.trim() || value.trim().length > limits[index]
  )) {
    return res.status(400).json({ message: "Enter all fields within the allowed lengths." });
  }
  const digits = PhoneNumber.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return res.status(400).json({ message: "Enter a phone number with 7 to 15 digits." });
  }
  await pool.query(
    `UPDATE Customer
     SET FirstName = ?, LastName = ?, PhoneNumber = ?, CustomerAddress = ?
     WHERE CustomerID = ?`,
    [...fields.map(value => value.trim()), req.customerId],
  );
  res.json({ message: "Account updated." });
});

router.post("/signup", async (req, res) => {
  let connection = null;
  let transactionStarted = false;
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      customerAddress,
      username,
      password,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !customerAddress ||
      !username ||
      !password
    ) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [existingUsers] = await connection.query(
      "SELECT CustomerAccountID FROM CustomerAccounts WHERE Username = ?",
      [username],
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({
        message: "Username is taken",
      });
    }

    const [customerResult] = await connection.query(
      "INSERT INTO Customer(FirstName, LastName, PhoneNumber, CustomerAddress) VALUES(?, ?, ?, ?)",
      [firstName, lastName, phoneNumber, customerAddress],
    );

    await connection.query(
      "INSERT INTO CustomerAccounts(CustomerID, Username, Password) VALUES(?,?,?)",
      [customerResult.insertId, username, password],
    );

    await connection.commit();
    transactionStarted = false;
    return res.status(201).json({
      message: "Account created succesfully!",
    });
  } catch (error) {
    if (connection != null && transactionStarted == true) {
      await connection.rollback();
      transactionStarted = false;
    }
    console.error("Signup failed:", error.message);
    return res.status(500).json({
      message: "Something went wrong during signp.",
    });
  } finally {
    if (connection != null) {
      connection.release();
    }
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        message: "Please enter both username and password",
      });
    }

    const [rows] = await pool.query(
      "SELECT ca.CustomerID, ca.Username, ca.AccountStatus, c.FirstName, c.LastName FROM CustomerAccounts AS ca JOIN Customer AS c ON ca.CustomerID = c.CustomerID WHERE ca.Username = ? AND ca.Password = ?",
      [username, password],
    );

    if (rows.length == 0) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    if (rows[0].AccountStatus !== "Active") {
      clearCustomerSession(res);
      return res.status(403).json({
        code: "ACCOUNT_INACTIVE",
        message: "Your account is marked as inactive. Please contact FreshMart for assistance.",
      });
    }

    const { AccountStatus, ...customer } = rows[0];
    createCustomerSession(res, customer.CustomerID);
    return res.status(200).json({
      message: "Logged in succesfully",
      customer,
    });
  } catch (error) {
    console.error("Login Failed", error.message);

    return res.status(500).json({
      message: "Something went wrong in Login",
    });
  }
});

router.post("/logout", (req, res) => {
  clearCustomerSession(res);
  res.json({ message: "Logged out." });
});

export default router;
