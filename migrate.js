import pool from "./src/db/index.js";
import { runMigrations } from "./src/db/index.js";

async function migrate() {
  try {
    await runMigrations();
    console.log("Database migration successful.");
  } catch (err) {
    console.error("Database migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
