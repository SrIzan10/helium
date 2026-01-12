import { clerkClient } from "@clerk/nuxt/server";
import { eq, and } from "drizzle-orm";
import { db } from "~/lib/db/index";
import * as schema from "~/lib/db/schema";
import type { H3Event } from "h3";

export async function getUserPresets(clerkUserId: string) {
  return await db.query.presetUsers.findMany({
    where: eq(schema.presetUsers.userId, clerkUserId),
    with: {
      preset: true,
    },
  });
}

export async function getPresetById(presetId: string) {
  return await db.query.presets.findFirst({
    where: eq(schema.presets.id, presetId),
  });
}

export async function userHasPresetAccess(
  presetId: string,
  userId: string,
): Promise<boolean> {
  const preset = await getPresetById(presetId);
  if (!preset) return false;

  if (preset.createdBy === userId) return true;

  const userPreset = await db.query.presetUsers.findFirst({
    where: and(
      eq(schema.presetUsers.presetId, presetId),
      eq(schema.presetUsers.userId, userId),
    ),
  });

  return !!userPreset;
}

export async function createPreset(
  userId: string,
  name: string,
  iceServers: string,
  isDefault: boolean = false,
) {
  const presetCreate = await db
    .insert(schema.presets)
    .values({
      createdBy: userId,
      name: name,
      iceServers: iceServers,
    })
    .returning({ insertedId: schema.presets.id });

  const insertedId = presetCreate[0]?.insertedId;
  if (!insertedId) {
    throw new Error("Failed to get inserted preset ID");
  }

  await db.insert(schema.presetUsers).values({
    presetId: insertedId,
    userId: userId,
    isDefault: isDefault,
  });

  return insertedId;
}

export async function updatePreset(
  presetId: string,
  name: string,
  iceServers: string,
) {
  await db
    .update(schema.presets)
    .set({
      name: name,
      iceServers: iceServers,
    })
    .where(eq(schema.presets.id, presetId));
}

export async function setPresetAsDefault(presetId: string, userId: string) {
  await db
    .update(schema.presetUsers)
    .set({ isDefault: false })
    .where(eq(schema.presetUsers.userId, userId));

  // set as default
  await db
    .update(schema.presetUsers)
    .set({ isDefault: true })
    .where(
      and(
        eq(schema.presetUsers.presetId, presetId),
        eq(schema.presetUsers.userId, userId),
      ),
    );
}

export async function unsetPresetAsDefault(presetId: string, userId: string) {
  await db
    .update(schema.presetUsers)
    .set({ isDefault: false })
    .where(
      and(
        eq(schema.presetUsers.presetId, presetId),
        eq(schema.presetUsers.userId, userId),
      ),
    );
}

export async function updatePresetDefaultStatus(
  presetId: string,
  userId: string,
  isDefault: boolean,
) {
  if (isDefault) {
    await setPresetAsDefault(presetId, userId);
  } else {
    await unsetPresetAsDefault(presetId, userId);
  }
}

export async function deletePreset(presetId: string) {
  await db.delete(schema.presets).where(eq(schema.presets.id, presetId));
}

export async function getOwnedPresets(userId: string) {
  return await db.query.presets.findMany({
    where: eq(schema.presets.createdBy, userId),
  });
}

export async function ownsPreset(
  presetId: string,
  userId: string,
): Promise<boolean> {
  const preset = await getPresetById(presetId);
  if (!preset) return false;
  return preset.createdBy === userId;
}

export async function markAsShareable(presetId: string, shareable: boolean) {
  await db
    .update(schema.presets)
    .set({ shareable })
    .where(eq(schema.presets.id, presetId));
}

export async function getPresetAuthorData(event: H3Event, presetId: string) {
  const preset = await getPresetById(presetId);
  if (!preset) {
    throw createError({ statusCode: 404, statusMessage: "Preset not found" });
  }
  const user = await clerkClient(event).users.getUser(preset.createdBy);
  return {
    id: user.id,
    fullName: user.fullName,
    profileImageUrl: user.imageUrl,
    username: user.username,
    email: user.primaryEmailAddress?.emailAddress || null,
  };
}
