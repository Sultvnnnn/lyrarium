# DESIGN.md — Lyrarium

Lyrarium adalah arsip lirik yang berperilaku seperti poster editorial oversized di atas kertas — kini dalam dua tema: kertas krem (light) dan tinta navy (dark), masing-masing dengan satu aksen kromatik. Tipografi memimpin (Switzer weight 300), gambar tampil utuh persegi tanpa crop, seluruh chrome kotak dan hairline, motion tenang dan editorial. Tidak ada shadow, tidak ada gradient dekoratif, tidak ada warna yang bocor antar tema.

## Color System

### Light theme (default)

| Role                | Token                 | Value                 |
| ------------------- | --------------------- | --------------------- |
| Canvas              | `--background`        | Bone White #fffef7    |
| Ink                 | `--foreground`        | Ink Black #000000     |
| Secondary text      | `--muted-foreground`  | Graphite #666666      |
| Hairlines / borders | `--border`            | Ash #aaaaaa           |
| **Accent**          | `--accent`            | Magenta Bloom #8a0467 |
| Accent on accent    | `--accent-foreground` | Bone White #fffef7    |

### Dark theme (`.dark`)

| Role                | Token                 | Value                  |
| ------------------- | --------------------- | ---------------------- |
| Canvas              | `--background`        | Navy Ink #101731       |
| Ink                 | `--foreground`        | Bone White #fffef7     |
| Secondary text      | `--muted-foreground`  | #aaaaaa                |
| Hairlines / borders | `--border`            | Charcoal Scale #4d4c4a |
| **Accent**          | `--accent`            | Signal Yellow #ffd001  |
| Accent on accent    | `--accent-foreground` | Navy Ink #101731       |

### Aturan aksen

- Satu aksen per tema. Magenta hidup di permukaan terang; Signal Yellow hidup di permukaan gelap.
- Inverted field menukar aksen: overlay menu berpermukaan navy (light theme) memakai hover Signal Yellow; overlay berpermukaan bone (dark theme) memakai hover Magenta Bloom.
- Semua hover interaktif resolve ke aksen tema: `hover:text-accent`, `hover:border-accent`, `group-hover:text-accent`.
- Aksen muncul hanya sebagai: hairline stroke (border-l lirik, border-l stats), fill tag pill, satu rupture card per baris grid, hover state, dan teks error. Tidak pernah sebagai flood background.

### Semantic tokens (Tailwind v4)

Seluruh komponen memakai utility semantik — bukan warna hardcoded: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-accent`, `text-accent`, `text-accent-foreground`. Mapping via `@theme inline` dari variabel `:root` / `.dark`.

Wajib: `@custom-variant dark (&:where(.dark, .dark *));` — variant `dark:` mengikuti class dari next-themes, tidak pernah prefers-color-scheme OS.

### Pensiun

Mint Wash, Powder Blue, Candy Pink, Forest Teal tidak lagi dipakai. Gradient charcoal-to-black tidak dipakai. Signal Yellow bukan lagi warna tag umum — ia aksen dark theme.

## Typography

Switzer (Fontshare), weight 300 dan 400 saja.

| Role       | Size / Leading | Tracking | Weight         |
| ---------- | -------------- | -------- | -------------- |
| Display    | 84 / 1.0       | -0.04em  | 300            |
| Heading    | 54 / 1.0       | -0.023em | 300            |
| Heading-sm | 34 / 1.25      | -0.02em  | 300            |
| Subheading | 20 / 1.4       | -0.018em | 300            |
| Body       | 16 / 1.4       | 0        | 400            |
| Body-sm    | 14 / 1.43      | 0        | 400            |
| Caption    | 12 / 1.43      | 0        | 400, uppercase |

- Weight 300 untuk seluruh display work (12–84px); 400 untuk body, meta, UI control.
- Heading tidak pernah bold. Line-height display/heading = 1.00; tambahkan `pb-[0.12em]` bila overflow-hidden memotong descender.
- Caption selalu uppercase: eyebrow, meta, tag, label form, footer.
- Link inherit warna ink; tidak ada biru default; underline hanya saat hover.

## Radius & Surfaces

- **0px sharp**: kartu, image, tombol, kontrol, input, kotak video.
- **1440px pill**: hanya tag pill (Lyrics / Archive).
- Tidak ada shadow di mana pun. Kedalaman diciptakan hairline, negative space, dan satu stroke aksen.
- Image selalu persegi 1:1 tanpa crop paksa (`aspect-square` + `object-cover`); cover detail dibatasi 420–460px.

## Layout

- Full-bleed, left-aligned, padding horizontal 32px; section rhythm 64px.
- Grid collection & discography: 3 kolom, gap 48px; satu rupture card per baris.
- Detail lirik: art-book spread `[1fr, auto]`, lalu dua kolom `[minmax(0,1fr), 360px]`.
- Negative space adalah komposisi — biarkan heading bernapas.

## Components

### Logo

Kotak 32px, field Ink Black, huruf "Ly" Bone White caption weight 300. Variant inverted (bone field, navy text) untuk overlay & dark mode. Tanpa animasi.

### Header

- Lockup: logo + "Lyrarium" (subheading, normal case) + tagline "// Every word, preserved." yang melebar saat hover via `grid-cols-[0fr] → [1fr]`; tagline berwarna aksen saat hover/overlay terbuka.
- Kontrol: tombol kotak outline 32px — Add (icon Plus), theme toggle (Sun/Moon). Menu = tombol kotak solid semantik (`bg-foreground text-background`), terbalik otomatis per tema; state open selalu kebalikan dari state tertutup tema berjalan.
- Overlay menu: full-screen inverted field (navy di light, bone di dark). Link bernomor (01, 02) di 54–84px weight 300, reveal staggered translate-y + fade 500ms, hover indent + aksen permukaan. Row hairline Charcoal Scale / Ash. Meta caption di kaki overlay.

### Theme motion

Pergantian tema memakai View Transitions API: clip-path circle melebar dari titik klik (600ms, ease-in-out). Button di-lock selama transisi (cancel animasi lama bila diklik cepat) untuk mencegah flicker. Fallback: swap instan. Tidak ada transisi warna global.

### Lyric Poster (hero home)

Satu baris lirik acak (15–70 karakter) dalam tanda kutip sebagai display heading; eyebrow = judul — artist. Rotasi tiap 6 detik ke item acak berbeda via framer-motion `AnimatePresence mode="wait"` (fade + y ±24, 600ms, ease [0.22,1,0.36,1]). Min-height stabil; hover heading → aksen.

### Collection card

Hanya tiga elemen: gambar persegi (atau fallback rupture/initial hairline), judul subheading 300, artist caption uppercase. Hover: judul → aksen. Tidak ada lirik clamp.

### Artist index & artist page

Row hairline dengan hover indent + aksen; slug = lowercase-trim sehingga variasi kapitalisasi menyatu. Halaman artist: stats trio, about, grid discography dengan bahasa card yang sama.

### Stats trio

Angka display 84px weight 300 dengan border-left 1px — kolom pertama aksen, sisanya border netral; label caption uppercase.

### Detail lirik

- Art-book spread: type field (eyebrow artist, display title, pills) rata bawah kiri; cover persegi utuh di kanan didampingi meta vertikal (`writing-mode: vertical-rl`, rotate-180) "Cover — {artist}".
- Pills: outline netral + fill aksen.
- Kolom lirik: border-left 1px aksen, body 16/1.4 pre-line.
- Aside sticky 360px: embed YouTube (`aspect-video`, sharp, lazy), About the artist, Credits — blok kosong auto-hidden.
- Navigasi prev/next editorial: split full-width, label caption + judul subheading, panah Lucide, hover aksen, divider hairline.

### Form (add)

Input kotak border 1px, focus → aksen; label caption uppercase; file upload dengan tombol file beraksen; submit kotak solid semantik dengan hover aksen. Error message berwarna aksen.

### Footer

Hairline top; tiga caption uppercase: © tahun Lyrarium / "are you listening yet?" / "Every word speaks".

## Iconography

Lucide React saja. Size 16, strokeWidth 1, currentColor, outline-only. Tidak ada icon fill, tidak ada ukuran lain.

## Motion Principles

- Tenang dan editorial: fade + translate kecil (≤24px), durasi 500–600ms, ease-out atau [0.22,1,0.36,1].
- Stagger 100ms untuk reveal berurutan (overlay menu).
- Hover: warna → aksen, indent 4–16px, border menebal ke aksen. Tanpa scale, bounce, atau shadow.
- Rotasi konten (lyric poster) selalu acak berbeda dari item aktif.

## Do & Don't

**Do**

- Heading weight 300, caption uppercase, hairline 1px.
- Satu aksen per tema; semua hover resolve ke `accent`.
- Chrome kotak 0px; pill hanya untuk tag.
- Cover persegi utuh; semantic tokens untuk semua warna.
- Inverted field hanya overlay menu & momen fitur.

**Don't**

- Bold pada heading; pure #fff / #000 di luar token.
- Shadow, gradient dekoratif, rounded button.
- Pastel, teal, atau aksen ganda dalam satu tema.
- `dark:` mengikuti OS; warna hardcoded di komponen.
- Centered stack (kecuali fallback hero kosong); crop paksa cover 1:1.
