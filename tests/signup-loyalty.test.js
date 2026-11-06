import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../backend/db.js';
import router from '../backend/routes/auth/customers.js';

const signup = router.stack.find(layer => layer.route?.path === '/signup').route.stack[0].handle;

async function runSignup(t, { duplicate = false, failEnrollment = false } = {}) {
  const events = [];
  const connection = {
    async beginTransaction() { events.push('begin'); },
    async commit() { events.push('commit'); },
    async rollback() { events.push('rollback'); },
    release() { events.push('release'); },
    async query(sql, values) {
      if (sql.startsWith('SELECT')) return [duplicate ? [{ CustomerAccountID: 1 }] : []];
      if (sql.startsWith('INSERT INTO Customer(')) {
        events.push('customer');
        return [{ insertId: 42 }];
      }
      if (sql.startsWith('INSERT INTO CustomerAccounts')) {
        assert.equal(values[0], 42);
        events.push('account');
        return [{}];
      }
      assert.match(sql, /INSERT INTO LoyaltyProgram/);
      assert.match(sql, /VALUES \(\?, 0, NOW\(\), 0, 0, NOW\(\)\)/);
      assert.deepEqual(values, [42]);
      events.push('loyalty');
      if (failEnrollment) throw new Error('Enrollment failed');
      return [{}];
    },
  };
  t.mock.method(pool, 'getConnection', async () => connection);
  t.mock.method(console, 'error', () => {});
  const res = {
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await signup({ body: {
    firstName: 'Test', lastName: 'Customer', phoneNumber: '5551234567',
    customerAddress: '123 Main St', username: 'test', password: 'test-password',
  } }, res);
  return { events, res };
}

test('signup automatically enrolls the new customer with zero loyalty points', async t => {
  const { events, res } = await runSignup(t);
  assert.equal(res.code, 201);
  assert.deepEqual(events, ['begin', 'customer', 'account', 'loyalty', 'commit', 'release']);
});

test('enrollment failure rolls back account creation', async t => {
  const { events, res } = await runSignup(t, { failEnrollment: true });
  assert.equal(res.code, 500);
  assert.deepEqual(events, ['begin', 'customer', 'account', 'loyalty', 'rollback', 'release']);
});

test('duplicate usernames do not create a customer or loyalty membership', async t => {
  const { events, res } = await runSignup(t, { duplicate: true });
  assert.equal(res.code, 409);
  assert.deepEqual(events, ['begin', 'rollback', 'release']);
});
