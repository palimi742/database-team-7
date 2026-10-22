const pool = require("../db");
const fs = require("node:fs");
const path = require("node:path");
// https://sidorares.github.io/node-mysql2/docs#first-query

const seeding_categories_sql = fs.readFileSync(
  path.join(__dirname, "../../db/seeding/seed_categories.sql"),
  "utf8",
);

async function seedCategories() {
  try {
    const result = await pool.query(seeding_categories_sql);
    console.log("success", result[0].affectedRows);
  } catch (err) {
    console.log("failed", err.message);
  } finally {
    await pool.end(); //closes connection
  }
}

seedCategories();
