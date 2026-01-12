import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { join } from "path";
import { existsSync } from "fs";

export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create a temporary pool for migrations
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const db = drizzle(pool, { schema });
    
    // Determine the correct migrations folder path
    // In development: ./drizzle from project root
    // In production (Docker): /app/drizzle
    let migrationsFolder = "./drizzle";
    
    if (existsSync("/app/drizzle/meta/_journal.json")) {
      migrationsFolder = "/app/drizzle";
    } else if (existsSync(join(process.cwd(), "drizzle/meta/_journal.json"))) {
      migrationsFolder = join(process.cwd(), "drizzle");
    }
    
    console.log("[DB] Running migrations from:", migrationsFolder);
    await migrate(db, { migrationsFolder });
    console.log("[DB] Migrations completed successfully");
  } catch (error) {
    console.error("[DB] Migration failed:", error);
    throw error;
  } finally {
    // Close the pool after migrations
    await pool.end();
  }
}
