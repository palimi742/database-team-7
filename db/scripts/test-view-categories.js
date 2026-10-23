// Run from the project root: node db/scripts/test-view-categories.js
import pool from "../../backend/db.js";

try {
  // Read the categories from MySQL and display them in the terminal.
  // Change the SELECT query to read other tables; this does not modify data.
  const [categories] = await pool.query(
    "SELECT * FROM Category"
  );
  console.table(categories);
} catch (error) {
  console.error("Query failed:", error.message);
} finally {
  // Close the pool so this standalone script can exit.
  await pool.end();
}
