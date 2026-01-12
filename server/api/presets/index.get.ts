import { getUserPresets } from "~/lib/utils/presetsDb";

export default defineEventHandler(async (event) => {
  const { isAuthenticated, userId } = event.context.auth();
  console.log("Fetching presets for user:", userId);
  if (!isAuthenticated) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  const data = await getUserPresets(userId);

  return {
    success: true,
    data: data,
  };
});
