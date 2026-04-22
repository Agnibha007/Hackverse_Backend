import dotenv from "dotenv";
import { runMigrations, closePool } from "./src/db/index.js";

dotenv.config();

async function migrate() {
  try {
    console.log("🔄 Running database migrations...");
    await runMigrations();
    console.log("✅ Migrations completed successfully");
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
