import {
  getPresetAuthorData,
  getPresetById,
  userHasPresetAccess,
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

  const preset = await getPresetById(id);
  if (!preset) {
    throw createError({ statusCode: 404, statusMessage: "Preset not found" });
  }
  const author = await getPresetAuthorData(event, id);

  return {
    success: true,
    data: preset,
    author,
  };
});
