import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("executed query", { text, duration, rows: res.rowCount });
  return res;
}

export async function runMigrations() {
  console.log("Running migrations...");
  const client = await pool.connect();
  try {
    const migrationPath = join(__dirname, 'migrations.sql');
    const sql = fs.readFileSync(migrationPath, "utf8");
    await client.query(sql);
    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  } finally {
    client.release();
  }
}

export default { query, runMigrations };

