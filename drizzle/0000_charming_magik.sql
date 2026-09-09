CREATE TABLE "songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"lyrics" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
