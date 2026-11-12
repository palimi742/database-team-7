import { Router } from "express";
import pool from "../../db.js";

const router = Router();

router.get("/coupons", async (req, res) => {
  try {
    const [coupons] = await pool.query(
      `SELECT CouponID AS id, CouponName, Description, UsesPerClip, CategoryID,
              UNIX_TIMESTAMP(TimeStart) AS startSeconds,
              UNIX_TIMESTAMP(TimeEnd) AS endSeconds, DiscountAmount
       FROM Coupons ORDER BY TimeStart DESC`,
    );
    const [categories] = await pool.query(
      "SELECT CouponID, CategoryID FROM CouponCategories",
    );
    const [products] = await pool.query(
      "SELECT CouponID, InventoryID FROM CouponProducts",
    );

    for (const coupon of coupons) {
      coupon.startsAt = new Date(coupon.startSeconds * 1000).toISOString();
      coupon.endsAt = new Date(coupon.endSeconds * 1000).toISOString();
      delete coupon.startSeconds;
      delete coupon.endSeconds;
      coupon.CategoryIDs = categories
        .filter((row) => row.CouponID === coupon.id)
        .map((row) => row.CategoryID);
      if (coupon.CategoryIDs.length === 0 && coupon.CategoryID !== null) {
        coupon.CategoryIDs = [coupon.CategoryID];
      }
      coupon.ProductIDs = products
        .filter((row) => row.CouponID === coupon.id)
        .map((row) => row.InventoryID);
    }
    res.json(coupons);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Unable to load coupons" });
  }
});

router.post("/coupons", saveCoupon);
router.put("/coupons/:id", saveCoupon);

async function saveCoupon(req, res) {
  const id = req.params.id === undefined ? null : Number(req.params.id);
  const {
    CouponName,
    Description,
    UsesPerClip,
    DiscountAmount,
    startsAt,
    endsAt,
    CategoryIDs = [],
    ProductIDs = [],
  } = req.body || {};
  const name = typeof CouponName === "string" ? CouponName.trim() : "";
  const description = typeof Description === "string" ? Description.trim() : "";
  const uses = Number(UsesPerClip);
  const discount = Number(DiscountAmount);
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);

  if (id !== null && (!Number.isInteger(id) || id < 1)) {
    return res.status(400).json({ message: "Invalid coupon ID" });
  }
  if (!name || name.length > 100 || !description || description.length > 500) {
    return res.status(400).json({
      message: "Enter a name and description (up to 100 and 500 characters)",
    });
  }
  if (!Number.isInteger(uses) || uses < 1 || uses > 20) {
    return res
      .status(400)
      .json({ message: "Limit must be a positive whole number" });
  }
  if (!Number.isFinite(discount) || discount < 0.01 || discount > 500) {
    return res.status(400).json({ message: "Enter a valid dollar discount" });
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    return res
      .status(400)
      .json({ message: "End time must be after start time" });
  }
  if (
    !validIDs(CategoryIDs) ||
    !validIDs(ProductIDs) ||
    (CategoryIDs.length !== 1 && ProductIDs.length === 0) ||
    (CategoryIDs.length > 0 && ProductIDs.length > 0)
  ) {
    return res
      .status(400)
      .json({ message: "Select specific products or one whole category" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const values = [
      name,
      description,
      uses,
      discount,
      Math.floor(start / 1000),
      Math.floor(end / 1000),
    ];
    let couponID = id;
    if (id === null) {
      const [result] = await connection.query(
        `INSERT INTO Coupons (CouponName, Description, UsesPerClip, DiscountAmount, TimeStart, TimeEnd)
         VALUES (?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?))`,
        values,
      );
      couponID = result.insertId;
    } else {
      const [result] = await connection.query(
        `UPDATE Coupons SET CouponName = ?, Description = ?, UsesPerClip = ?,
           DiscountAmount = ?, TimeStart = FROM_UNIXTIME(?), TimeEnd = FROM_UNIXTIME(?),
           CategoryID = NULL,
           TableUpdateTime = CURRENT_TIMESTAMP
         WHERE CouponID = ?`,
        [...values, id],
      );
      if (!result.affectedRows) {
        await connection.rollback();
        return res.status(404).json({ message: "Coupon not found" });
      }
      await connection.query(
        "DELETE FROM CouponCategories WHERE CouponID = ?",
        [id],
      );
      await connection.query("DELETE FROM CouponProducts WHERE CouponID = ?", [
        id,
      ]);
    }

    if (CategoryIDs.length) {
      await connection.query(
        "INSERT INTO CouponCategories (CouponID, CategoryID) VALUES ?",
        [[...new Set(CategoryIDs)].map((categoryID) => [couponID, categoryID])],
      );
    }
    if (ProductIDs.length) {
      await connection.query(
        "INSERT INTO CouponProducts (CouponID, InventoryID) VALUES ?",
        [[...new Set(ProductIDs)].map((productID) => [couponID, productID])],
      );
    }
    await connection.commit();
    res.status(id === null ? 201 : 200).json({ message: "Coupon saved" });
  } catch (err) {
    if (connection) await connection.rollback();
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ message: "A selected category or product no longer exists" });
    }
    if (
      ["ER_NO_DEFAULT_FOR_FIELD", "ER_BAD_NULL_ERROR"].includes(err.code) &&
      err.sqlMessage?.includes("'CategoryID'")
    ) {
      return res.status(500).json({
        message:
          "The database must allow NULL in coupons.CategoryID before saving coupons.",
      });
    }
    console.error(err.message);
    res.status(500).json({ message: "Unable to save coupon" });
  } finally {
    connection?.release();
  }
}

function validIDs(ids) {
  return (
    Array.isArray(ids) && ids.every((id) => Number.isSafeInteger(id) && id > 0)
  );
}

router.delete("/coupons/:id", async (req, res) => {
  const promotionID = Number(req.params.id);

  if (!Number.isInteger(promotionID) || promotionID <= 0) {
    return res.status(400).json({ message: "Invalid promotion ID" });
  }
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM ClippedCoupons WHERE CouponID = ?", [
        promotionID,
      ]);
      await connection.query("DELETE FROM UsedCoupons WHERE CouponID = ?", [
        promotionID,
      ]);
      const [result] = await connection.query(
        "DELETE FROM Coupons WHERE CouponID = ?",
        [promotionID],
      );
      if (!result.affectedRows) {
        await connection.rollback();
        return res.status(404).json({ message: "Coupon not found" });
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to delete coupon" });
  }
});

export default router;
