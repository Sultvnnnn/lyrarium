import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  featuring: text("featuring"),
  lyrics: text("lyrics").notNull(),
  imageUrl: text("image_url"),
  aboutArtist: text("about_artist"),
  credits: text("credits"),
  youtubeUrl: text("youtube_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  about: text("about"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lyraInsights = pgTable("lyra_insights", {
  id: serial("id").primaryKey(),
  songId: integer("song_id")
    .notNull()
    .unique()
    .references(() => songs.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  model: text("model"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
export type LyraInsight = typeof lyraInsights.$inferSelect;
export type NewLyraInsight = typeof lyraInsights.$inferInsert;

