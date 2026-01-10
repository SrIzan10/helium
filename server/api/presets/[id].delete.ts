import { eq, and } from "drizzle-orm";
import { db } from "~/lib/db";
import { presets, presetUsers } from "~/lib/db/schema";

export default defineEventHandler(async (event) => {
  const { isAuthenticated, userId } = event.context.auth();
  
  if (!isAuthenticated || !userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing preset ID" });
  }

  // Check if the user is the creator of the preset
  const preset = await db.query.presets.findFirst({
    where: eq(presets.id, id),
  });

  if (!preset) {
    throw createError({ statusCode: 404, statusMessage: "Preset not found" });
  }

  if (preset.createdBy !== userId) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: You can only delete your own presets" });
  }

  // Delete the preset (cascades to presetUsers)
  await db.delete(presets).where(eq(presets.id, id));

  return { success: true };
});
