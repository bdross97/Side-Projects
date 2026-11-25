# meridian

Personal site for meridian. Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion. Static export: `npm run build` writes plain HTML/CSS/JS to `out/`. There is no backend.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (getEventState)
npm run typecheck  # tsc --noEmit
npm run lint
npm run build      # placeholder check, then static export to out/
```

Requires Node 20+. vitest is pinned to v3 because v4+ needs Node 22.

---

## Editing content

All copy, links, and media references live in `/content`. Components never hold text.

| file | what's in it |
|---|---|
| `content/site.ts` | the single source of truth for all site copy: nav, socials, bio, influences, labels, form copy, the Formspree id, hero image, bio collage, contact portrait, the wordmark settings |
| `content/events.ts` | every show, upcoming and past |
| `content/gallery.ts` | gallery photos, in display order |
| `content/mixes.ts` | YouTube mixes (`featured: true` renders first and larger) |
| `content/types.ts` | the shapes the files above must match |

Edit a value, save, done. TypeScript will complain if a field is missing or misspelled.

- **nav**: `site.nav` feeds the header, the mobile menu, and the footer.
- **socials**: `site.social` feeds the footer, the mobile menu, and the home "follow" section.
- **influences**: delete `site.bio.influences` entries (or set it to `[]`) to hide that line.
- **home loop slot**: set `site.home.loop` to `null` to remove it.
- **genre banner**: `site.home.genres`.
- **bio**: `site.bio.text`, one string per paragraph.
- **bio collage**: `site.bio.portrait` is the main photo; `site.bio.collage` lists the small flower photos and which corner or edge of the portrait each one overlaps (`top-left`, `top-right`, `left`, `bottom-right`). Size, tilt and drift per spot are in `SPOTS` in `app/bio/page.tsx`.
- **contact portrait**: `site.contact.portrait`.
- **socials**: each entry in `site.social` has an `icon` (`instagram`, `youtube` or `soundcloud`); the marks live in `components/SocialLinks.tsx`.
- **photo strip**: the home "through the lens" strip uses every photo in `content/gallery.ts`, nature or not, with `site.home.stripNote` under the heading. Add photos there to grow both the strip and the gallery.

## Adding real media

Put files in `public/` with space-free names, then point `/content` at them (paths start with `/`, e.g. `/media/photos/photo-09.jpg`).

**Photos.** Before adding a photo, strip its metadata (phone photos carry GPS location) and resize anything over about 2.5 MB to 2400px on the long edge, quality about 82. Also make a `-sm.jpg` copy at 1200px for grids. Then add an entry to `content/gallery.ts`:

```ts
{ kind: "image", src: "/media/photos/photo-09.jpg", thumb: "/media/photos/photo-09-sm.jpg",
  width: 2400, height: 1600, alt: "what is actually in the photo", focal: "50% 40%" }
```

`focal` is a CSS `object-position`: where the subject sits, so crops keep it. `"30% 60%"` means 30% from the left and 60% from the top.

**Video.** Every video slot is a `VideoItem` with `src: undefined` until you add the file. While `src` is missing, `<MediaSlot>` draws a bordered box with the label (`NATURE_LOOP_HERE`, `HERO_LOOP_HERE`). Once `src` is set it renders a muted, looping, inline `<video>` with the poster. It only starts playing after load, and never under `prefers-reduced-motion`.

- hero loop: `site.hero.video.src`. It plays over the hero photo, which stays as the poster.
- home loop: `site.home.loop.src` (and `poster`).

**Treatment.** Any image or video entry can set `treatment: "inverted"`, which displays it color-inverted with a CSS `invert(1)` filter. If a file is already inverted on disk, leave it on `"none"`.

## Events and posters

Add an object to `content/events.ts`:

```ts
{
  id: "venue-2027-03-06",
  title: "show title",
  venue: "venue",              // optional
  city: "salt lake city",
  date: "2027-03-06",          // America/Denver date, or "DATE_HERE"
  timeLabel: "10pm",           // optional, display only
  with: "other acts",          // optional
  role: "afterparty",          // optional
  link: "https://tickets...",  // optional; adds an "info" button
  poster: poster("poster-venue-mar-6", "show title", "2027-03-06", 1080, 1440), // optional
},
```

For a poster (if you designed the flyer, pass `true` as the last argument to `poster(...)`; that adds "flyer designed by meridian" under it):
1. Save two metadata-free copies in `public/media/posters/`: `name.jpg` (1600px on the long edge, or the original size if smaller, quality about 85, no crop) and `name-thumb.jpg` (640px wide).
2. Pass `name` (no `.jpg`) and the full-size pixel width and height to `poster(...)`. The alt text is generated as `poster for {title}, {date}`.

Shows without a poster render as a plain text card.

## Upcoming vs past

All of this lives in one helper, `getEventState(event, now)` in `lib/eventState.ts`. Every page uses it.

- "now" is always Salt Lake City time (`America/Denver` via `Intl.DateTimeFormat`), never the visitor's zone.
- A show becomes **past** after 06:00 on the morning after its date, so late shows count as "tonight" until morning.
- `DATE_HERE` dates are always past. They sort last on /past-shows with no date shown, and `npm run build` prints a warning listing them.
- **/shows** and the home teaser (at most 3): upcoming shows only, soonest first.
- **/past-shows**: once a show passes it moves here straight away, in full color, newest first, grouped by year, permanently.

**Staying current**: the HTML is frozen at build time, so pages first render with the build-time state, then re-check against the visitor's real clock straight after hydration. A daily rebuild keeps the raw HTML current too, see below.

**Testing the dates (dev only)**: add `?now=YYYY-MM-DD` to any URL under `npm run dev`, e.g. `/shows/?now=2026-11-28`. It is treated as noon in Salt Lake City that day. Production builds ignore it.

## Daily rebuild

Cron schedules are in UTC: `0 14 * * *` is 14:00 UTC, 7am MST or 8am MDT, after the 06:00 cutoff.

**Option A, Vercel (recommended)**: `.github/workflows/daily-rebuild-vercel.yml`.
1. Vercel project > Settings > Git > Deploy Hooks: create a hook for the production branch and copy the URL.
2. GitHub repo > Settings > Secrets and variables > Actions: add `VERCEL_DEPLOY_HOOK_URL` with that URL.
3. The workflow POSTs to the hook daily. Run it by hand from the Actions tab to test.

**Option B, GitHub Pages**: move `docs/github-pages-deploy.yml` into `.github/workflows/` and delete the Vercel workflow. Set Settings > Pages > Source to "GitHub Actions". It builds on every push to `main` and daily at 14:00 UTC.

Workflows only run when this folder is the root of its own GitHub repo. Right now it sits inside the `Side-Projects` repo, where they are ignored.

## Booking form (Formspree)

1. Create a form at formspree.io and copy its id (the part after `formspree.io/f/`).
2. Set `formspreeId` in `content/site.ts`.

Until then the contact page shows "the form isn't connected yet" with a mailto link, never a form that silently fails. Fields: name, email, venue or event, date, message, plus a hidden `_gotcha` honeypot that Formspree uses to drop bot submissions. On failure it shows the email address.

## Fonts

- **Outfit** (section headers only, lowercase): `app/fonts/Outfit-Variable.ttf`, OFL licensed (`app/fonts/OFL.txt`), loaded with `next/font/local` in `app/layout.tsx`. Exposed as `--font-outfit` and as Tailwind's `font-display`. It's used only by `components/SectionHeading.tsx`.
- **Inter** (all body text): `next/font/google` in `app/layout.tsx`, exposed as `--font-inter` and Tailwind's `font-sans`.

To swap the display font: drop the new file in `app/fonts/`, change `src` (and `weight` if it isn't variable) in the `localFont({...})` call. Keep `variable: "--font-outfit"`, or rename it and update `--font-display` in `app/globals.css`.

To swap the body font: replace `Inter` in the `next/font/google` import and call with another Google font (e.g. `import { Manrope } from "next/font/google"`). Keep `variable: "--font-inter"`, or rename it and update `--font-sans` in `app/globals.css`.

## Brand system

Bright and light: a pink sky wash with plum text and one accent. Tokens live in `app/globals.css`, wired into Tailwind's `@theme`:

| token | value | Tailwind | use |
|---|---|---|---|
| `--sky-top` / `--sky-bottom` | `#ece4f1` / `#f6d5d9` | (body background) | the page wash, lavender at the top to pink at the bottom |
| `--canvas` | `#f3dfe6` | `bg-canvas` | panels and overlays |
| `--ink` | `#2b2230` | `text-ink` | text (11:1 or better on the wash) |
| `--accent` | `#9c2349` | `text-accent`, `bg-accent` | links, buttons, the divider line, focus outlines (5.6:1 or better) |

The sky tones are lightened from `photo-sky-pink.jpg` (its top band averages `#d3c8e3`, its bottom `#fab2ba`). The accent is the deep pink of the lilies in photo-02 and photo-03. The Tailwind name is `canvas`, not `base`, because `text-base` is already Tailwind's font size.

The only divider is `<MeridianLine>`, a 1px accent line.

## Motion

- **Wordmark**: see below.
- **Nav tabs**: a thin line sweeps through the label on hover, like the logo (`.line-sweep` in `app/globals.css`).
- **Slow drift**: the hero photo slowly zooms and pans (`.drift-soft`, kept gentle so it stays zoomed out).
- **Scroll reveals**: sections, gallery photos, and mixes fade up as they scroll into view (`components/Reveal.tsx`).
- **Parallax**: the bio flowers drift at their own speeds over the portrait (`components/Float.tsx`); the contact portrait moves inside its frame (`components/Parallax.tsx`).
- **Line sweep** also runs on the follow links, "all shows", and "all mixes on youtube".
- **Rolling banners**: the genre banner and the "through the lens" photo strip on home (`components/Marquee.tsx`, `components/PhotoStrip.tsx`). Both pause on hover.

Under `prefers-reduced-motion` all of it stops: no drift, no parallax, no reveals, the banners stand still and scroll by hand, and the wordmark line is just drawn.

## Wordmark

One component, `<Wordmark tone intro />` in `components/Wordmark.tsx`, used in the hero, header, footer, and mobile menu. It stacks two 1000x1000 layers on the same canvas: the name and the gradient line.

- **The name never moves.** Only the line animates.
- **Intro (hero only)**: on the first visit of a browser session the line draws through the name left to right (1.2s, clip-path). Repeat visits in the same session start with it drawn. An inline script in `app/layout.tsx` handles that before first paint, so nothing flashes.
- **Hover (hero and header)**: the line leaves to the right, then draws back in from the left, so it passes through the name.
- **tone**: `"light"` uses the white layers (`name-no-line.png`, `line.png`) on photos; `"dark"` uses `name-no-line-black.png` and `line-black.png` on the sky background. The black files are the white layers with their color set to black: same pixels, same alpha, so the gradient line is untouched.
- **Line offset**: as exported, `line.png` sits on the baseline of the name. The static logo has it through the middle of the letters, so the line layer is moved up by `site.brand.wordmarkLineOffsetY = "-4%"` (40px of 1000, measured from `logo-white.png`). Set it to `"0%"` if you re-export the layers already aligned.

To replace the assets, overwrite the files in `public/brand/` (keeping the names) and regenerate the `-black` copies. If the canvas size changes, update `wordmarkCanvas` in `content/site.ts` and `CROP_TOP`/`CROP_HEIGHT` in `components/Wordmark.tsx` (the rows on the canvas that hold the art).

The favicon is `logo-black.svg`. The share image is `public/og.jpg`, a 1200x630 crop of `profile-kodachrome.jpg`.

## Deploy (Vercel, from the Side-Projects monorepo)

This folder lives inside the `bdross97/Side-Projects` repo next to other projects, the same way `techoma/` does.

**Git: only ever stage this folder.** Other folders in the repo have unrelated work in progress.

```bash
git add meridian-site/
git commit -m "..."
git push
```

Never `git add -A` or `git add .` from the repo root. `meridian-site/.gitignore` already covers `node_modules`, `.next`, `out` and `.env*`.

**Vercel**: create a new, separate Vercel project (not the techoma one):
1. Import `bdross97/Side-Projects`.
2. Set **Root Directory** to `meridian-site`. The framework preset (Next.js) and `output: "export"` handle the rest.
3. Deploy. It gets its own URL, env vars and deploys, independent of techoma.
4. Put the real domain in `site.url` in `content/site.ts`, and the Formspree id in `formspreeId`.

**Daily rebuild**: GitHub only runs workflows from the repo root, so `meridian-site/.github/workflows/daily-rebuild-vercel.yml` does nothing where it is. To turn it on, copy it to `Side-Projects/.github/workflows/` (it only calls the deploy hook, so it works unchanged), create a Deploy Hook in the new Vercel project (Settings > Git > Deploy Hooks), and add it as the `VERCEL_DEPLOY_HOOK_URL` repo secret. See "Daily rebuild" above.

**GitHub Pages** (alternative): see option B under "Daily rebuild". The same root-folder rule applies, and the workflow needs `working-directory: meridian-site` on its npm steps.

**Anywhere else**: `npm run build` and upload `out/`.

---

## What was stubbed or assumed

### Placeholders to fill in (grep for them)

| placeholder | where | what |
|---|---|---|
| `FORMSPREE_ID_HERE` | `content/site.ts` | Formspree form id; the form stays "not connected" until set |
| `SITE_URL_HERE` | `content/site.ts` (`url`) | real domain, for share images and metadata |
| `CITY_HERE` | `content/events.ts`, the blend (nov 8) | city; the poster only says utah coffee collective, which is also used as the venue |
| `NATURE_LOOP_HERE` | `content/site.ts` `home.loop` | nature loop video for the home page |
| `HERO_LOOP_HERE` | `content/site.ts` `hero.video` | optional hero video; the photo shows until set |

### Read off posters (`FROM_POSTER_CONFIRM` in `content/events.ts`)

| event | field | value from poster |
|---|---|---|
| mother-2027-01-08 | venue | mother cafe & bar |
| mother-2027-01-08 | timeLabel | 9pm to 1am |
| mother-2026-11-05 | venue | mother cafe & bar |
| mother-2026-11-13 | date | 2026-11-13 (poster: 11.13.26) |
| mother-2026-11-13 | venue | mother cafe & bar |
| mother-2026-11-13 | timeLabel | 9pm to 1am |
| mother-2026-11-13 | with | spindoc ("spindoc + meridian") |
| techoma-2026-10-30 | date | 2026-10-30 (poster: 10.30.26) |
| techoma-2026-10-30 | venue | the alley at drift lounge |
| techoma-2026-10-30 | city | salt lake city (poster: "slc ut") |
| techoma-2026-10-30 | timeLabel | 8pm to 1am (event hours; meridian's slot is 11pm to 12am) |
| techoma-2026-10-30 | with | yinzey, kush, spindoc, ell |

### Mismatches (your value kept)

- **meridian @ mother, january**: now jan 8 2027, matching the poster (01.08.27). Id `mother-2027-01-08`.
- **techoma title**: you gave "techoma". The poster reads "the techoma x drift" (debut pop-up). Kept "techoma".

### POSTER_CONFIRM

- `poster-hom-darkened.jpg` is dated **11.05.26**, so it's on `mother-2026-11-05`.
- `poster-mother-spindoc.jpg` is dated **11.13.26**, so it's on the other house of mother event. That event's date was `DATE_HERE`; it is now 2026-11-13 and its id was renamed from `mother-DATE_HERE` to `mother-2026-11-13`. Likewise `techoma-DATE_HERE` became `techoma-2026-10-30`. With those dates filled in, no events use `DATE_HERE` right now.
- lane 8 afterparty: venue unspoken, ogden, with justin cornwall and ell, poster `poster-lane8-afterparty.jpg` (from `16716.jpg`).
- the blend (nov 8 2026): with kush and bootlegg, poster `poster-the-blend.jpg` (from `IMG_1636.jpg`). You described the files the other way round; they were assigned by what each poster shows.

### Judgment calls

- **Hero photo**: photo-03 (pink lilies), as you asked. A soft plum shade sits behind the white wordmark only; the rest of the photo stays bright and drifts slowly.
- **Mixes**: in this order, titles shortened from the youtube video titles (checked 2026-11-24): "sunrise set, kodachrome basin", "midnight set", "summer storm set" (from "30 minute melodic house set during a summer storm"), "sunset sessions vol. 5". The rest are behind "all mixes on youtube".
- **Bio**: written from what you told me plus what's already on the site (the kodachrome sunrise set, the downtown late shows, the photos and flyers being yours). Lowercase like the rest of the site, and written without pronouns.
- **Genre banner**: melodic house, progressive house, melodic techno, deep house, organic house, afro house, tech house, bass house.
- **Portraits**: both were HEIF files despite the .JPEG/.PNG names; converted, stripped of metadata, saved as `public/media/portraits/portrait-01.jpg` (bio) and `portrait-02.jpg` (contact).
- **Bio collage**: photo-02 (lily close-up, top left), photo-09 (monarch on flowers, from IMG_8021, top right), photo-01 (hibiscus, left edge), photo-11 (pink roses, bottom right). Nothing on the bottom left.
- **Flyer credit**: on the three house of mother flyers and the techoma flyer, not the miracle at varley ones. Those four also appear in a "flyers" section on the gallery page, pulled automatically from `content/events.ts`.
- **Gallery and strip**: 42 photos, in a deliberately shuffled order so photos shot in sequence (the red-lit nights, the skies, the plume flowers...) don't sit next to each other. The gallery grid fills left to right, row by row, so the list order is what you see across each row. To add a photo, put it anywhere in the list, away from similar ones. The two dj crowd shots (photo-27, photo-28, from IMG_7735/IMG_7764) and photo-08 have `strip: false`, so they're in the gallery but not the "captured by meridian" strip. The strip rolls the opposite way to the genre banner.
- **Bio collage**: bottom right is now photo-11 (pink roses); the lilies stay in the hero, gallery and strip.
- **Gallery**: a masonry of photos at their own shapes, revealed on scroll, with a slight zoom on hover. The hero (photo-03), the sky background, and profile-kodachrome are left out. The order is florals (photo-01, photo-02), then landscapes (photo-05, photo-06, photo-07, photo-04), then photo-08.
- **Share image**: profile-kodachrome holds up (logo centered and legible), so `og.jpg` is a center crop of it. It isn't used anywhere else.
- **Line offset** on the wordmark: see "Wordmark" above.
- **Home loop slot**: added so the nature loop has somewhere to go. It's a placeholder box until set; `home.loop = null` removes it.
- **Poster lightbox size**: posters that are smaller than 1600px (the 1080x1440 mother posters, the 1200x1500 varley posters) are kept at their original size, not upscaled.
- **Scaffold config**: removed `cacheComponents` and `partialPrefetching` from the generated `next.config.ts`, since a static export doesn't need them.
- **Header**: frosted glass over the page, so it works over both the hero photo and the sky.
- **Mix thumbnails** load from `i.ytimg.com` (YouTube's `hqdefault` image). The player loads from `youtube-nocookie.com` only on click.
- **`?now=` override** means noon (UTC-7) in Salt Lake City on that date.
