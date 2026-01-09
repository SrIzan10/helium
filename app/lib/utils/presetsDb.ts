import { eq } from "drizzle-orm";
import { db } from "~/lib/db/index";
import * as schema from "~/lib/db/schema";

export async function getUserPresets(clerkUserId: string) {
  return await db.query.presetUsers.findMany({
    where: eq(schema.presetUsers.userId, clerkUserId),
    with: {
      preset: true,
    },
  });
}
