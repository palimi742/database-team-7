import test from 'node:test';
import assert from 'node:assert/strict';
import { applyClippedCoupons, calcTotals } from '../backend/routes/cart/cartHelpers.js';
import { registerReturnRoutes } from '../backend/routes/cart/returnRoutes.js';

test('coupons reduce eligible unit prices, cap at zero, and leave other categories alone', async () => {
  const db = { async query(sql) {
    if (sql.includes('ClippedCoupons')) {
      assert.match(sql, /CURRENT_TIMESTAMP BETWEEN c.TimeStart AND c.TimeEnd/);
      return [[{ClippedCouponID: 1, CategoryID: 5, DiscountAmount: 3, CouponName: 'Save'}]];
    }
    return [[{InventoryID: 10, CategoryID: 5}, {InventoryID: 11, CategoryID: 6}]];
  }};
  const items = await applyClippedCoupons(db, 1, [
    {productId: 10, price: 2, quantity: 2}, {productId: 11, price: 4, quantity: 1},
  ]);
  assert.equal(items[0].price, 0);
  assert.equal(items[0].customerCouponId, 1);
  assert.equal(items[1].price, 4);
  assert.equal(items[1].customerCouponId, null);
  assert.equal(calcTotals(items, 'curbside').total, 4);
});

async function requestReturn(quantity, reserved, rejected = false) {
  let handler;
  let inserted = false;
  let committed = false;
  let released = false;
  const connection = {
    async beginTransaction() {}, async rollback() {},
    async commit() { committed = true; }, release() { released = true; },
    async query(sql) {
      if (sql.includes('FOR UPDATE')) return [[{id: 2, quantity: 1, unitPrice: 4}]];
      if (sql.includes("Status = 'Rejected'")) return [rejected ? [{ReturnRequestID: 1}] : []];
      if (sql.includes('AS reserved')) return [[{reserved}]];
      if (sql.includes('OrderFulfillment')) return [[]];
      if (sql.includes('INSERT INTO ReturnRequests')) { inserted = true; return [{}]; }
      throw new Error(sql);
    },
  };
  const pool = { async query() { return [[{id: 1, ageDays: 0}]]; }, async getConnection() { return connection; } };
  registerReturnRoutes({post(path, ...handlers) { handler = handlers.at(-1); }}, pool);
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await handler({body: {transactionItemId: 2, quantity, reason: 'Damaged'}, params: {orderId: 1}, customerId: 1}, res, error => {throw error;});
  assert.equal(released, true);
  return {res, inserted, committed};
}

test('cannot request two units when only one was purchased', async () => {
  const result = await requestReturn(2, 0);
  assert.equal(result.res.code, 400);
  assert.equal(result.inserted, false);
});
test('pending or approved quantities cannot be requested again', async () => {
  const result = await requestReturn(1, 1);
  assert.equal(result.res.code, 400);
  assert.equal(result.inserted, false);
});
test('a rejected request blocks resubmission even with unreturned quantity', async () => {
  const result = await requestReturn(1, 0, true);
  assert.equal(result.res.code, 400);
  assert.match(result.res.body.error, /cannot be resubmitted/);
  assert.equal(result.inserted, false);
  assert.equal(result.committed, false);
});

test('discounted totals and return refunds use the same saved price', async () => {
  const db = { async query(sql) {
    if (sql.includes('ClippedCoupons')) return [[{ClippedCouponID: 1, CategoryID: 5, DiscountAmount: 1.25, CouponName: 'Save'}]];
    return [[{InventoryID: 10, CategoryID: 5}]];
  }};
  const items = await applyClippedCoupons(db, 1, [{productId: 10, price: 4.99, quantity: 3}]);
  assert.equal(items[0].price, 3.74);
  assert.equal(items[0].lineTotal, 11.22);
  assert.equal(calcTotals(items, 'curbside').total, 11.22);
});

test('an item without a rejected request can still be returned', async () => {
  const result = await requestReturn(1, 0);
  assert.equal(result.res.code, 200);
  assert.equal(result.inserted, true);
  assert.equal(result.committed, true);
});
