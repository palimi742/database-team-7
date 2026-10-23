// Run from the project root: node db/scripts/test-db.js
// Or from backend/: node ../db/scripts/test-db.js
// This test only reads data; it does not create or change any records.

// Reuse the backend's MySQL pool, environment settings, and TLS certificate.
// A pool manages reusable connections instead of opening a new one per query.
import pool from '../../backend/db.js';

async function testConnection() {
    try {
        // SELECT 1 checks the connection without depending on any project table.
        // mysql2 returns [rows, fieldMetadata]; we only need the rows here.
        // Success confirms connectivity, not that every table or feature works.
        const [rows] = await pool.query('SELECT 1 AS connected');
        console.table(rows);

        // NEXT: Read existing records. Uncomment to list your categories:
        // const [categories] = await pool.query(
        //     'SELECT CategoryID, CategoryName FROM Category ORDER BY CategoryName'
        // );
        // console.table(categories);

        // Filter using ? placeholders and a separate array of values.
        // Never build SQL by joining user input into the query string.
        // const [products] = await pool.execute(
        //     'SELECT InventoryID, InventoryName, Price FROM Inventory WHERE CategoryID = ?',
        //     [1]
        // );
        // console.table(products);

        // NEXT: Input data. This example is commented out because it WRITES a row.
        // Only run it intentionally in a development database with a suitable name.
        // Running it repeatedly may create duplicate category names.
        
        // const [result] = await pool.execute(
        //     'INSERT INTO Category (CategoryName) VALUES (?)',
        //     ['Example category']
        // );
        // console.log('New category ID:', result.insertId);

        // UPDATE and DELETE also accept placeholders. Use a WHERE clause targeting
        // the intended record, and inspect result.affectedRows afterward.
        // For changes that must succeed together, use one connection and a
        // transaction (beginTransaction, commit/rollback, then release).

        // WEBSITE: Put queries in backend routes for React to call.
        // GET /api/categories can SELECT rows and return res.json(rows).
        // POST /api/categories can validate req.body, then INSERT using placeholders.
        // Protect write routes with the appropriate user/role authorization.
        // Keep database access in the backend; React calls /api with fetch().
    } catch (error) {
        console.error('Connection/query failed:', error.message);
        process.exitCode = 1;
    } finally {
        // Close connections so this standalone script can exit.
        // Do NOT end the shared pool after each Express request: the server reuses it.
        await pool.end();
    }
}

testConnection();
