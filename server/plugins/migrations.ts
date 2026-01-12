import { runMigrations } from "../../app/lib/db/migrate";

export default defineNitroPlugin(async () => {
  // Run migrations once when the server starts
  try {
    await runMigrations();
  } catch (error) {
    console.error("[Server] Failed to run migrations on startup:", error);
    // In production, you may want to throw here to prevent server startup
    // For now, we'll just log the error and continue
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
});
