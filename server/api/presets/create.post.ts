import { clerkClient } from "@clerk/nuxt/server";
import { schema as zodSchema } from "~/lib/schema/new-preset";
import { createPreset } from "~/lib/utils/presetsDb";

export default defineEventHandler(async (req) => {
  const reqBody = await readBody(req);
  if (reqBody && reqBody.iceServers) {
    reqBody.iceServers = JSON.stringify(reqBody.iceServers);
  }

  const body = zodSchema.safeParse(reqBody);
  if (body.success === false) {
    setResponseStatus(req, 400);
    return {
      success: false,
      message: "Invalid request body",
    };
  }

  const { isAuthenticated, userId } = req.context.auth();

  if (!isAuthenticated) {
    setResponseStatus(req, 401);
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const user = await clerkClient(req).users.getUser(userId);

  try {
    await createPreset(
      user.id,
      body.data.name,
      body.data.iceServers,
      body.data.default,
    );
  } catch (e: any) {
    setResponseStatus(req, 500);
    return {
      success: false,
      message: "Database error",
    };
  }

  return {
    success: true,
    message: "Preset created successfully",
  };
});
