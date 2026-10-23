import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { readFileSync } from "node:fs";

dotenv.config({ path: new URL("./.env", import.meta.url) });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: readFileSync(new URL("../db/certs/azure-ca.pem", import.meta.url)),
    rejectUnauthorized: true,
    verifyIdentity: true,
  },
});

export default pool;
