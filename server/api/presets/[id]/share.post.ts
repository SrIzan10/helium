import { markAsShareable, ownsPreset } from "~/lib/utils/presetsDb";

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

  if (!(await ownsPreset(id, userId))) {
    setResponseStatus(event, 403);
    return {
      success: false,
      message: "Forbidden",
    };
  }

  await markAsShareable(id, true);

  return {
    success: true,
    message: "Preset marked as shareable",
  };
});
