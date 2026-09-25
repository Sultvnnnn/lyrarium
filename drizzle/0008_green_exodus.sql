ALTER TABLE "lyra_insights" DROP CONSTRAINT "lyra_insights_song_id_unique";--> statement-breakpoint
ALTER TABLE "lyra_insights" ADD COLUMN "language" text DEFAULT 'id' NOT NULL;--> statement-breakpoint
ALTER TABLE "lyra_insights" ADD CONSTRAINT "lyra_insights_song_id_lang_unique" UNIQUE("song_id","language");