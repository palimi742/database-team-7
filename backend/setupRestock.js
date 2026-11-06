import { readFileSync } from "node:fs";
import pool from "./db.js";

let connection;

try {
  console.log("Starting restock database setup...");

  const sql = readFileSync(
    new URL("../db/employee_inventory_restock.sql", import.meta.url),
    "utf8",
  );

  if (!sql.trim()) {
    throw new Error("The SQL file is empty. Save it first.");
  }

  connection = await pool.getConnection();

  const [existing] = await connection.query(`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND LOWER(TABLE_NAME) IN (
        'restockrequests',
        'restockrequesthistory'
      )
  `);

  if (existing.length > 0) {
    console.table(existing);
    throw new Error(
      "Restock tables already exist. Share this output before continuing.",
    );
  }

  let delimiter = ";";
  let statement = "";
  let completed = 0;

  for (const line of sql.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("--")) {
      continue;
    }

    const delimiterCommand = trimmed.match(
      /^DELIMITER\s+(\S+)$/i,
    );

    if (delimiterCommand) {
      if (statement.trim()) {
        throw new Error("Unexpected SQL before DELIMITER.");
      }

      delimiter = delimiterCommand[1];
      continue;
    }

    statement += `${line}\n`;

    if (statement.trimEnd().endsWith(delimiter)) {
      const query = statement
        .trimEnd()
        .slice(0, -delimiter.length);

      await connection.query(query);

      completed += 1;
      console.log(`Completed SQL statement ${completed}.`);
      statement = "";
    }
  }

  if (statement.trim()) {
    throw new Error("The SQL file has an unfinished statement.");
  }

  if (completed !== 4) {
    throw new Error(
      `Expected 4 SQL statements but completed ${completed}. Share this output.`,
    );
  }

  console.log("Restock database setup completed successfully.");
} catch (error) {
  console.error("Setup stopped:", error.message);
  console.error(
    "If any statements completed, share this output before running again.",
  );
  process.exitCode = 1;
} finally {
  if (connection) {
    connection.release();
  }

  await pool.end();
}