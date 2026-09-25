CREATE TABLE "lyra_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_id" integer NOT NULL,
	"content" text NOT NULL,
	"model" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "lyra_insights_song_id_unique" UNIQUE("song_id")
);
--> statement-breakpoint
ALTER TABLE "lyra_insights" ADD CONSTRAINT "lyra_insights_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;