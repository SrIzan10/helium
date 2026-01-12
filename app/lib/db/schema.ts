import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const peers = pgTable("peers", {
  id: text("id").primaryKey(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  broadcaster: text("broadcaster")
    .notNull()
    .references(() => peers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const roomViewers = pgTable("room_viewers", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  viewerId: text("viewer_id")
    .notNull()
    .references(() => peers.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const presets = pgTable("presets", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by").notNull(),
  name: text("name").notNull().unique(),
  iceServers: text("ice_servers").notNull(), // stringified json obv
  shareable: boolean("shareable").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const presetUsers = pgTable(
  "preset_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    presetId: uuid("preset_id")
      .notNull()
      .references(() => presets.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (table) => ({
    uniquePresetUser: uniqueIndex().on(table.presetId, table.userId),
  }),
);

// relations
export const peersRelations = relations(peers, ({ many }) => ({
  roomsAsbroadcaster: many(rooms, { relationName: "broadcaster" }),
  roomViewersAsViewer: many(roomViewers, { relationName: "viewer" }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  broadcasterPeer: one(peers, {
    fields: [rooms.broadcaster],
    references: [peers.id],
    relationName: "broadcaster",
  }),
  viewers: many(roomViewers, { relationName: "room" }),
}));

export const roomViewersRelations = relations(roomViewers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomViewers.roomId],
    references: [rooms.id],
    relationName: "room",
  }),
  viewer: one(peers, {
    fields: [roomViewers.viewerId],
    references: [peers.id],
    relationName: "viewer",
  }),
}));

export const presetsRelations = relations(presets, ({ many }) => ({
  presetUsers: many(presetUsers),
}));

export const presetUsersRelations = relations(presetUsers, ({ one }) => ({
  preset: one(presets, {
    fields: [presetUsers.presetId],
    references: [presets.id],
  }),
}));
