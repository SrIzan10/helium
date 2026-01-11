import { getPresetById, userHasPresetAccess } from "~/lib/utils/presetsDb";
import { db } from "~/lib/db/index";
import * as schema from "~/lib/db/schema";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const { isAuthenticated, userId } = event.context.auth();

  if (!isAuthenticated || !userId) {
    setResponseStatus(event, 401);
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  if (!id) {
    setResponseStatus(event, 400);
    return {
      success: false,
      message: "Missing preset ID",
    };
  }

  const preset = await getPresetById(id);
  if (!preset) {
    setResponseStatus(event, 404);
    return {
      success: false,
      message: "Preset not found",
    };
  }

  if (!preset.shareable) {
    setResponseStatus(event, 403);
    return {
      success: false,
      message: "This preset is not shareable",
    };
  }

  // Check if user already has this preset
  const userAlreadyHasPreset = await db.query.presetUsers.findFirst({
    where: (presetUsers, { eq, and }) =>
      and(
        eq(presetUsers.presetId, id),
        eq(presetUsers.userId, userId),
      ),
  });

  if (userAlreadyHasPreset) {
    return {
      success: false,
      message: "You already have this preset imported",
    };
  }

  // Add preset to user
  await db.insert(schema.presetUsers).values({
    presetId: id,
    userId: userId,
    isDefault: false,
  });

  return {
    success: true,
    message: "Preset imported successfully",
  };
});
