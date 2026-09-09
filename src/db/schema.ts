import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  lyrics: text("lyrics").notNull(),
  imageUrl: text("image_url"),
  aboutArtist: text("about_artist"),
  credits: text("credits"),
  youtubeUrl: text("youtube_url"),
  createdAt: timestamp("created_at").defaultNow(),
});
