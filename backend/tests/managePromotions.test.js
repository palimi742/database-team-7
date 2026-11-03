import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import router from "../routes/managePromotions.js";
import pool from "../db.js";

test("promotion API validates input, saves offers, and protects conflicts", async () => {
  const originalQuery = pool.query;
  let mode = "success";
  const writes = [];
  pool.query = async (sql, values) => {
    if (sql.startsWith("SELECT")) {
      return [mode === "overlap" ? [{ id: 2 }] : []];
    }
    if (mode === "failure") throw new Error("Database request failed");
    writes.push({ sql, values });
    return [{ affectedRows: mode === "missing" ? 0 : 1 }];
  };
  const app = express();
  app.use(express.json());
  app.use("/promotions", router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/promotions`;
  const body = {
    CategoryID: 1,
    CouponName: "Fresh savings",
    DiscountAmount: "2.50",
    startsAt: "2026-10-01T12:00:00Z",
    endsAt: "2026-11-01T12:00:00Z",
  };
  const send = (path, data = body, method = "POST") =>
    fetch(url + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "DELETE" ? undefined : JSON.stringify(data),
    });
  try {
    assert.equal((await send("/unknown")).status, 404);
    for (const invalid of [
      { DiscountAmount: "-1" },
      { CategoryID: "" },
      { CouponName: " " },
      { endsAt: body.startsAt },
    ]) {
      assert.equal(
        (await send("/coupons", { ...body, ...invalid })).status,
        400,
      );
    }
    assert.equal((await send("/coupons")).status, 201);
    assert.equal(writes[0].values[4], body.CouponName);
    assert.equal((await send("/sales")).status, 201);
    assert.match(writes[1].sql, /INSERT INTO SeasonalSales/);
    assert.equal((await send("/coupons/1", body, "PUT")).status, 200);
    mode = "overlap";
    assert.equal((await send("/coupons")).status, 400);
    mode = "missing";
    assert.equal((await send("/sales/1", body, "PUT")).status, 404);
    assert.equal((await send("/sales/1", null, "DELETE")).status, 404);
    mode = "failure";
    assert.equal((await send("/coupons/1", null, "DELETE")).status, 500);
    mode = "success";
    assert.equal((await send("/sales/1", null, "DELETE")).status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    pool.query = originalQuery;
    await pool.end();
  }
});
