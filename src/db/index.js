import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 100) {
      console.warn(`Slow query (${duration}ms):`, text);
    }
    return res;
  } catch (error) {
    console.error("Database query error:", error.message);
    throw error;
  }
}

export async function runMigrations() {
  try {
    const migrationPath = new URL("./migrations.sql", import.meta.url).pathname;
    const sql = fs.readFileSync(
      migrationPath.replace(/^\/([A-Z]:)/, "$1"),
      "utf8",
    );
    await pool.query(sql);
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error.message);
    throw error;
  }
}

export async function getConnection() {
  return await pool.connect();
}

export async function closePool() {
  await pool.end();
}

export default pool;
