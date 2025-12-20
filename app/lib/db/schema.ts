import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const peers = pgTable('peers', {
  id: text('id').primaryKey(),
  lastSeen: timestamp('last_seen').notNull().defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  broadcaster: text('broadcaster').notNull().references(() => peers.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const roomViewers = pgTable('room_viewers', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: text('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  viewerId: text('viewer_id')
    .notNull()
    .references(() => peers.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});
