CREATE TABLE "peers" (
	"id" text PRIMARY KEY NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_viewers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" text NOT NULL,
	"viewer_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"broadcaster" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_viewers" ADD CONSTRAINT "room_viewers_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_viewers" ADD CONSTRAINT "room_viewers_viewer_id_peers_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."peers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_broadcaster_peers_id_fk" FOREIGN KEY ("broadcaster") REFERENCES "public"."peers"("id") ON DELETE cascade ON UPDATE no action;