CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"about" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "artists_name_unique" UNIQUE("name"),
	CONSTRAINT "artists_slug_unique" UNIQUE("slug")
);
