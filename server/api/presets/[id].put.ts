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

  const body = await readBody(event);
  
  // Verify ownership
  const preset = await db.query.presets.findFirst({
    where: eq(presets.id, id),
  });

  if (!preset) {
    throw createError({ statusCode: 404, statusMessage: "Preset not found" });
  }

  if (preset.createdBy !== userId) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: You can only edit your own presets" });
  }

  // Update preset
  await db.update(presets)
    .set({
      name: body.name,
      iceServers: JSON.stringify(body.iceServers),
    })
    .where(eq(presets.id, id));

  // Update default status in presetUsers
  if (body.default !== undefined) {
    // If setting as default, first unset all other defaults for this user
    if (body.default) {
      await db.update(presetUsers)
        .set({ isDefault: false })
        .where(eq(presetUsers.userId, userId));
    }
    
    // Update the default status for this preset
    await db.update(presetUsers)
      .set({ isDefault: body.default })
      .where(and(
        eq(presetUsers.presetId, id),
        eq(presetUsers.userId, userId)
      ));
  }

  return { success: true };
});
