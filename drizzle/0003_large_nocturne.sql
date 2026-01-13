ALTER TABLE "presets" DROP CONSTRAINT "presets_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "presets_created_by_name_index" ON "presets" USING btree ("created_by","name");