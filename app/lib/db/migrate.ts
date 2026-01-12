import { migrate } from "drizzle-orm/neon-http/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  try {
    const db = drizzle(process.env.DATABASE_URL, { schema });
    console.log("[DB] Running migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[DB] Migrations completed successfully");
  } catch (error) {
    console.error("[DB] Migration failed:", error);
    throw error;
  }
}
