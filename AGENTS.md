<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENT.md — Working on Lyrarium

Ground truth & hard rules for AI agents in this codebase. Read fully before any change. If this file conflicts with your defaults, this file wins.

## 0. Project ground truth (do not hallucinate)

- Lyrarium = a lyrics archive with an editorial-poster aesthetic. NOT a music player, NOT a social app, NOT a store.
- Stack: Next.js 16 App Router (Turbopack), React 19, TypeScript, Tailwind CSS v4 (CSS-first config in `globals.css`), Drizzle ORM + Supabase Postgres, Supabase Storage bucket `song-images`, next-themes (class strategy), framer-motion, lucide-react. Font: Switzer 300/400 only.
- Routes: `/` (lyric-poster hero, collection + search, artist index, stats), `/lyrics/[id]`, `/artist/[slug]`, `/add`.
- Mutations: server action `addSong` (`src/app/actions/songs.ts`) only. **No edit, no delete, no auth, no CMS, no pagination, no tests exist.** Never assume they do.
- Schema `songs`: `id, title, artist, lyrics, imageUrl, aboutArtist, credits, youtubeUrl, createdAt`. All detail fields nullable; UI must hide empty ones.
- Components: `SiteHeader` (client; fullscreen overlay menu), `SiteFooter`, `Logo`, `ThemeToggle` (client; View Transitions circle reveal), `LyricPoster` (client; 6s random rotation).
- Libs: `src/lib/supabase-storage.ts` (`uploadSongImage`), YouTube parsing lives in `src/app/lyrics/[id]/page.tsx` (`getYouTubeEmbedUrl`).
- Design source of truth: `DESIGN.md` at repo root. Read it before any UI work.

## 1. Design law (violations = redo)

1. **Semantic tokens only**: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-accent`, `text-accent`, `text-accent-foreground`. Raw palette classes (`text-ink-black`, `bg-signal-yellow`, hex values) are forbidden in components, except: (a) overlay-menu surfaces (`bg-navy-ink text-bone-white` + `dark:` inverse), (b) logo square, (c) gradient scrim none — scrims are retired.
2. **One accent per theme**: light = Magenta Bloom, dark = Signal Yellow, both via `--accent`. Never place both accents on one surface. Inverted surfaces swap: yellow on navy, magenta on bone.
3. **Every hover/focus resolves to accent** (`hover:text-accent`, `hover:border-accent`, `group-hover:text-accent`). No other hover colors.
4. **No shadows. No gradients. No glassmorphism/blur. No glow/neon.** Depth = hairlines + whitespace + one accent stroke.
5. **Radius 0px everywhere** except tag pills (`rounded-pills`, 1440px). Buttons, inputs, cards, images, iframes = sharp squares.
6. **Type**: Switzer; headings/display weight 300; body/meta 400; captions 12px uppercase. Never bold headings. Never blue default links. Tracking per DESIGN.md scale.
7. **Icons**: lucide-react only, `size={16} strokeWidth={1}`, currentColor, outline. No emoji, no filled icons, no other sizes.
8. **Images**: square 1:1, sharp, `object-cover` inside square frames; detail cover capped 420–460px; no rounded masks, no hover zoom.
9. **Layout**: left-aligned, full-bleed, `px-8`, 64px section rhythm. No centered hero stacks. No rows of three equal feature cards.
10. **Motion**: quiet & editorial — fade + ≤24px translate, 500–600ms, ease-out or `[0.22,1,0.36,1]`; stagger 100ms; no bounce/scale/elastic. Theme switch = View Transitions circle reveal only, with click-lock to prevent flicker.

## 2. AI-slop blacklist (never generate)

- Indigo/purple/pink gradients, aurora blobs, mesh or noise backgrounds
- `backdrop-blur`, frosted-glass cards or navbars
- `rounded-2xl` cards, `shadow-lg`, ring glows
- Emoji as icons or in copy ("✨", "🚀")
- Centered headline + subtitle + two-button hero
- Three equal feature cards with icons in colored circles
- Weight 700–900 headings, gradient text (`bg-clip-text`)
- Testimonials, pricing tables, FAQ accordions, cookie banners, newsletter popups
- Marketing copy: "Welcome to…", "Unlock", "Supercharge", "Your journey starts here", exclamation marks
- New UI dependencies (component libs, icon packs, animation libs) without explicit user approval
- Restyling untouched components "for consistency" unless asked

## 3. Copy voice

Terse editorial statements with a period: "The archive.", "Artists.", "Every word speaks." Lowercase questions allowed: "are you listening yet?" Double-slash separators: "// Every word, preserved." Uppercase only via caption class. Indonesian for form microcopy ("Simpan", "Semua field wajib diisi"), English for editorial labels. Match existing copy per file; never invent new tone.

## 4. Code conventions

- Server Components by default; `"use client"` only for state/effects/motion (header, toggle, poster).
- Mutations only via server actions; validate → `redirect`; `revalidatePath("/")` after writes.
- Search/filter via URL params + GET forms (`?q=`, `?artist=`). No client filter state on server pages.
- Next 16: `params` and `searchParams` are Promises — always `await`.
- Pages using `Math.random` (home hero) keep `export const dynamic = "force-dynamic"`.
- Schema changes: edit `src/db/schema.ts`, then `bunx drizzle-kit generate && bunx drizzle-kit push`. Never hand-write SQL.
- Uploads only via `uploadSongImage()`; max 5MB; store public URL in `songs.imageUrl`.
- YouTube: store raw URL; embed via `getYouTubeEmbedUrl()`; iframe `aspect-video`, `loading="lazy"`.
- Theme: next-themes `attribute="class"`; `@custom-variant dark (&:where(.dark, .dark *))` must stay; never rely on `prefers-color-scheme`.
- Optional fields (`imageUrl`, `aboutArtist`, `credits`, `youtubeUrl`) render nothing when null — always guard.

## 5. Workflow

1. Read `DESIGN.md` + this file.
2. Inspect the existing file first; reuse established patterns (card grid, hairline rows, stats trio, editorial prev/next nav, art-book spread).
3. Smallest diff that satisfies the request. No drive-by refactors.
4. Mentally verify light theme, dark theme, and overlay-open state: contrast + correct accent per surface.
5. Reply in Indonesian, concise, code-first.

## 6. Definition of done (UI change)

- [ ] Zero hex / raw palette classes outside allowed exceptions
- [ ] All hover/focus = accent
- [ ] Sharp chrome; pills only for tags
- [ ] No shadow / gradient / blur introduced
- [ ] Headings weight 300; captions uppercase
- [ ] Lucide 16/1 only
- [ ] Light + dark + overlay states checked
- [ ] No new dependencies
- [ ] Migration generated & pushed if schema touched
