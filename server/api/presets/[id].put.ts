import {
  getPresetById,
  updatePreset,
  updatePresetDefaultStatus,
} from "~/lib/utils/presetsDb";

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
  const preset = await getPresetById(id);

  if (!preset) {
    throw createError({ statusCode: 404, statusMessage: "Preset not found" });
  }

  if (preset.createdBy !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: You can only edit your own presets",
    });
  }

  // Update preset
  await updatePreset(id, body.name, JSON.stringify(body.iceServers));

  // Update default status in presetUsers
  if (body.default !== undefined) {
    await updatePresetDefaultStatus(id, userId, body.default);
  }

  return { success: true };
});
