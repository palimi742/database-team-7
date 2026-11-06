import pool from "./db.js";

try {
  const [columns] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND (
        (LOWER(TABLE_NAME) = 'employee'
          AND COLUMN_NAME = 'EmployeeID')
        OR
        (LOWER(TABLE_NAME) = 'inventory'
          AND COLUMN_NAME IN (
            'InventoryID', 'SKU', 'InventoryName',
            'CategoryID', 'StockQuantity'
          ))
      )
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);

  console.table(columns);

  const [settings] = await pool.query(
    "SHOW VARIABLES LIKE 'lower_case_table_names'"
  );

  console.table(settings);
} catch (error) {
  console.error("Check failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}