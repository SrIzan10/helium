import { eq } from "drizzle-orm";
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

  // Fetch the preset
  const preset = await db.query.presets.findFirst({
    where: eq(presets.id, id),
  });

  if (!preset) {
    throw createError({ statusCode: 404, statusMessage: "Preset not found" });
  }

  // Check if user has access (either creator or has it in their presetUsers)
  const userPreset = await db.query.presetUsers.findFirst({
    where: eq(presetUsers.presetId, id),
  });

  if (preset.createdBy !== userId && (!userPreset || userPreset.userId !== userId)) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  return {
    success: true,
    data: preset,
  };
});
