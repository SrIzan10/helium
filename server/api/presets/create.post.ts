import { clerkClient } from "@clerk/nuxt/server";
import { db } from "~/lib/db";
import * as schema from "~/lib/db/schema";
import { schema as zodSchema } from "~/lib/schema/new-preset";

export default defineEventHandler(async (req) => {
  const reqBody = await readBody(req);
  if (reqBody.iceServers) {
    reqBody.iceServers = JSON.stringify(reqBody.iceServers);
  }

  const body = zodSchema.safeParse(reqBody);
  if (body.success === false) {
    console.log(body.error, JSON.stringify(reqBody));
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request body",
    });
  }

  const { isAuthenticated, userId } = req.context.auth();

  if (!isAuthenticated) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const user = await clerkClient(req).users.getUser(userId);
  try {
    const presetCreate = await db
      .insert(schema.presets)
      .values({
        createdBy: user.id,
        name: body.data.name,
        iceServers: body.data.iceServers,
      })
      .returning({ insertedId: schema.presets.id });
    await db.insert(schema.presetUsers).values({
      presetId: presetCreate[0].insertedId,
      userId: user.id,
      isDefault: body.data.default,
    });
  } catch (e) {
    console.error("Error creating preset:", e);
    const error = e as PostgresError;
    if (error.code === "23505") {
      throw createError({
        statusCode: 400,
        statusMessage: "A preset with this name already exists",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create preset",
    });
  }
  return {
    success: true,
    message: "Preset created successfully",
  };
});
interface PostgresError extends Error {
  code: string;
  detail?: string;
  constraint?: string;
}
