import { Router } from "express";
import pool from "../db.js";
const router = Router();

// Create a cart
router.post("/", async (req, res) => {
  const customerID = Number(req.body.customerID);
  if (!Number.isInteger(customerID) || customerID <= 0) {
    return res.status(400).json({
      message: "Invalid customer ID",
    });
  }

  try {
    const results = await pool.execute(
      `INSERT INTO cart (CustomerID)
            VALUES (?)
            ON DUPLICATE KEY UPDATE CartID = LAST_INSERT_ID(CartID)
            `,
      [customerID],
    );

    res.json({
      cartId: results[0].insertId,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      message: "Unable to open cart.",
    });
  }
});

// Get cart contents and total
router.get("/:cartID", async (req, res) => {
  const cartID = Number(req.params.cartID);

  if (!Number.isInteger(cartID) || cartID <= 0) {
    return res.status(400).json({
      message: "Invalid cart ID",
    });
  }

  try {
    const cartResult = await pool.query(
      `SELECT i.InventoryID, i.InventoryName, i.CategoryID,
              i.Price, cd.Quantity
       FROM cartdetail cd
       JOIN inventory i ON i.InventoryID = cd.InventoryID
       WHERE cd.CartID = ?`,
      [cartID],
    );

    const items = cartResult[0];

    const salesResult = await pool.query(
      `SELECT CategoryID, DiscountAmount
       FROM seasonalsales
       WHERE CURRENT_TIMESTAMP BETWEEN SalesStart AND SalesEnd`,
    );

    const sales = salesResult[0];
    let total = 0;

    for (const item of items) {
      let discount = 0;

      for (const sale of sales) {
        if (
          Number(sale.CategoryID) === Number(item.CategoryID) &&
          Number(sale.DiscountAmount) > discount
        ) {
          discount = Number(sale.DiscountAmount);
        }
      }

      item.Price = Math.max(Number(item.Price) - discount, 0);
      item.LineTotal = item.Price * Number(item.Quantity);
      total = total + item.LineTotal;
    }

    res.json({ items, total });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      message: "Unable to load cart contents",
    });
  }
});

// Add an item
router.post("/:cartID/items", async (req, res) => {
  let quantity = 1;
  const cartID = Number(req.params.cartID);
  const inventoryID = Number(req.body.inventoryID);
  if (req.body.quantity !== undefined && req.body.quantity !== null) {
    quantity = Number(req.body.quantity);
  }

  if (
    !Number.isInteger(cartID) ||
    cartID <= 0 ||
    !Number.isInteger(inventoryID) ||
    inventoryID <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({
      message: "valid cart ID, inventory ID, and quantity",
    });
  }
  try {
    await pool.query(
      `INSERT INTO cartdetail (CartID, InventoryID, Quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE Quantity = Quantity + ?`,
      [cartID, inventoryID, quantity, quantity],
    );
    res.json({ ok: true });
  } catch (err) {
    console.log("unable to add to cart", err.message);
    res.status(500).json({
      message: "unable to add to cart",
    });
  }
});

// Change quantity (0 or less removes the item)
router.put("/:cartID/items/:inventoryID", async (req, res) => {
  const cartID = Number(req.params.cartID);
  const inventoryID = Number(req.params.inventoryID);
  const quantity = Number(req.body.quantity);

  if (
    !Number.isInteger(cartID) ||
    cartID <= 0 ||
    !Number.isInteger(inventoryID) ||
    inventoryID <= 0 ||
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    return res.status(400).json({
      message: "Valid cart ID, inventory ID, and quantity are required.",
    });
  }

  try {
    if (quantity === 0) {
      await pool.query(
        `DELETE FROM cartdetail
         WHERE CartID = ? AND InventoryID = ?`,
        [cartID, inventoryID],
      );
    } else {
      await pool.query(
        `UPDATE cartdetail
         SET Quantity = ?
         WHERE CartID = ? AND InventoryID = ?`,
        [quantity, cartID, inventoryID],
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      message: "Unable to update cart quantity.",
    });
  }
});

// Remove one item
router.delete("/:cartID/items/:inventoryID", async (req, res) => {
  const cartID = Number(req.params.cartID);
  const inventoryID = Number(req.params.inventoryID);

  if (
    !Number.isInteger(cartID) ||
    cartID <= 0 ||
    !Number.isInteger(inventoryID) ||
    inventoryID <= 0
  ) {
    return res.status(400).json({
      message: "Invalid cartID or inventoryID",
    });
  }

  try {
    await pool.query(
      "DELETE FROM cartdetail WHERE CartID = ? AND InventoryID = ?",
      [cartID, inventoryID],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      message: "Unable to remove cart item",
    });
  }
});

// Empty the cart
router.delete("/:cartID", async (req, res) => {
  const cartID = Number(req.params.cartID);
  if (!Number.isInteger(cartID) || cartID <= 0) {
    return res.status(400).json({
      message: "invalid cart ID",
    });
  }
  try {
    await pool.query(`DELETE FROM cartdetail WHERE CartID = ? `, [cartID]);
    res.json({ ok: true });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      message: "failed to empty cart",
    });
  }
});

export default router;
