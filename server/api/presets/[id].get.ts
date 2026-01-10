import { getPresetById, userHasPresetAccess } from "~/lib/utils/presetsDb";

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
  const preset = await getPresetById(id);

  if (!preset) {
    throw createError({ statusCode: 404, statusMessage: "Preset not found" });
  }

  // Check if user has access
  const hasAccess = await userHasPresetAccess(id, userId);
  if (!hasAccess) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  return {
    success: true,
    data: preset,
  };
});
