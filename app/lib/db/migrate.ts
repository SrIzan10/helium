import { migrate } from "drizzle-orm/neon-http/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { join } from "path";
import { existsSync } from "fs";

export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  try {
    const db = drizzle(process.env.DATABASE_URL, { schema });
    
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
  }
}
