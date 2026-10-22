// https://sidorares.github.io/node-mysql2/docs
// preparing a connection to the database

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("node:fs")
const path = require("node:path")

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,

  ssl: {
    ca: fs.readFileSync(
      path.join(__dirname, "../db/certs/azure-ca.pem"),
    ),
  },
});

module.exports = pool;
