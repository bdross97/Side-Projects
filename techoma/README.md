# The TECHOMA

Site shell for The TECHOMA — mobile DJ sound rig built on a lifted 4x4 Tacoma, based in Salt Lake City. Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion, built to deploy as a static site on Vercel.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build + static export to /out
npm run lint     # ESLint
```

## Editing copy, specs, events, and gallery

Everything editable lives in `/content`, not scattered through components:

- **`content/site.ts`** — wordmark, tagline, mission statement, the four description paragraphs, nav links, social links/email, the three use-case blurbs, the rig spec grid (`Tops`/`Sub`/`Decks`/`Power`/`Setup Time`/`Footprint`), event types, SEO defaults.
- **`content/events.ts`** — add/remove events here. Each event: `date` (ISO `"2026-07-18"`), `title`, `location` (use `"Location TBA"` if unset), `lineup` (array of DJ names), optional `ticketUrl`, optional `flyerSrc`. Leave the array empty to show the "No stops on the map yet" empty state. The Events page automatically splits items into Upcoming/Past by date.
- **`content/gallery.ts`** — add gallery tiles here. Each item: `type` (`"image"` or `"video"`), `alt`, optional `aspect` (`"square"` / `"portrait"` / `"landscape"`), and `src` once you have media.

Placeholder values are written in `SCREAMING_SNAKE_CASE_HERE` (e.g. `INSTAGRAM_URL_HERE`, `contact@EMAIL_HERE`, `SPEC_VALUE_HERE`) so they're easy to grep for and impossible to miss.

## Adding images and videos

All media placeholders go through the `<MediaSlot>` component (`components/ui/MediaSlot.tsx`). With no `src`, it renders a bordered black box with a small ConeMark and a label (e.g. `IMAGE 01 · 16:9`). Once you add a `src`, it automatically renders an `<img>` or, for video files (`.mp4`/`.webm`/`.mov`/`.m4v`), a `<video>` that autoplays, muted, looped, and inline.

To add real media:

1. Drop files in `/public` (e.g. `/public/media/rig-hero.jpg`).
2. Reference them from `content/events.ts` / `content/gallery.ts` (`flyerSrc` / `src`), or pass `src="/media/rig-hero.jpg"` directly to a `<MediaSlot>` in `app/the-rig/page.tsx` or `app/deployments/page.tsx`.

Since the site exports statically (`output: "export"` in `next.config.ts`), images use a plain `<img>` tag rather than `next/image` — no image-optimization server is needed, and nothing further to configure.

## Connecting Formspree

1. Create a form at [formspree.io](https://formspree.io) and copy its form ID (the part after `/f/` in your endpoint).
2. Copy `.env.local.example` to `.env.local` and set:
   ```
   NEXT_PUBLIC_FORMSPREE_ID=your_form_id_here
   ```
3. Restart the dev server (env vars are read at build time).

Until this is set, the Book page shows a "Booking form isn't connected yet" message with a `mailto:` fallback instead of a broken form — nothing crashes.

In Vercel, set `NEXT_PUBLIC_FORMSPREE_ID` under Project Settings → Environment Variables.

## Swapping or updating the display font (Paladins)

The wordmark/headers font is loaded locally via `next/font/local` from `public/fonts/Paladins.woff2`, wired up in `app/layout.tsx`. To swap it:

1. Put the new font file in `public/fonts/`.
2. If it's a `.ttf`/`.otf`, convert it to `.woff2` first (smaller, faster):
   ```bash
   pip install fonttools brotli
   python3 -m fontTools.ttLib.woff2 compress -o public/fonts/YourFont.woff2 path/to/YourFont.ttf
   ```
3. Update the `localFont({ src: ... })` call in `app/layout.tsx` to point at the new file.

Body/UI text uses JetBrains Mono via `next/font/google` (also in `app/layout.tsx`) — swap the import there for Space Grotesk or another technical sans if you'd rather.

Both fonts are wired into Tailwind as `font-display` (Paladins — wordmark, page titles, section headers only) and `font-sans` (JetBrains Mono — everything else) in `app/globals.css`. Never use `font-display` for body copy.

## Favicon / app icons / OG image

Generated as static placeholders from the ConeMark (concentric-rings) motif and the Paladins wordmark:

- `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` — Next's file-based icon convention, picked up automatically.
- `public/og-image.png` — black background, white wordmark, used for Open Graph/Twitter cards.

Regenerate any of these with a real design whenever you like — just overwrite the files at those paths (same names/locations) and Next will pick them up automatically.

## The Wordmark / ConeMark system

- `components/motion/Wordmark.tsx` — the animated TECHOMA logo: scramble-decode on mount, the "O" renders as `<ConeMark>`, idle glitch every 6–10s once resolved, desktop-only cursor-proximity letter displacement. Used at three sizes (`hero`, `header`, `footer`); pass `skipDecode` for persistent chrome (header/footer) so it doesn't re-scramble on every navigation.
- `components/motion/ConeMark.tsx` — the standalone speaker-cone motif (concentric pulsing rings), reused for the favicon/app icons, the loading screen, and empty states.
- `components/motion/DecodeText.tsx` — lighter decode effect for section headers, triggered once when scrolled into view.
- `components/motion/LoadingScreen.tsx` — full-screen intro, shown once per browser session (`sessionStorage`), skippable by click/tap/Enter/Space.

All of the above respect `prefers-reduced-motion` (falls back to plain fades/static rings) via `components/motion/useReducedMotion.ts`.

## Deploying to Vercel

1. Push this repo to GitHub (private or public).
2. In Vercel, "Add New Project" → import the repo. Framework preset: Next.js (Vercel will detect `output: "export"` and serve the static build automatically).
3. Add the `NEXT_PUBLIC_FORMSPREE_ID` environment variable (see above) before your first production deploy, or the booking form will show its "not connected" state in production.
4. Deploy. No other configuration is required — there's no backend/API routes.

## What was stubbed or assumed

- **Formspree ID**: left unset (`NEXT_PUBLIC_FORMSPREE_ID` is empty by default) — the Book page shows the "not connected yet" fallback until you add one.
- **Paladins font weight**: the base/regular family (`paladins.ttf`, named plainly "Paladins") was used for the wordmark, not one of the stylistic variants (3D, Outline, Laser, Condensed, etc.) that were also found installed on this machine — swap it in `app/layout.tsx` if you'd rather use a different cut.
- **Body/UI font**: JetBrains Mono (not Space Grotesk) — both were offered as options in the brief; Mono felt closer to the "SIGNAL / STATUS: ACTIVE" technical-readout aesthetic.
- **All media is placeholder** (`MediaSlot` with no `src`): hero/profile shots on The Rig, the three Deployments images, event flyers, and all 9 gallery tiles. No real photos/video were provided yet, as expected.
- **Events data is empty** — the events array ships empty so the site correctly shows the "No stops on the map yet" state; a commented-out example object is left in `content/events.ts` as a template.
- **Spec grid values**: labels are real (`Tops`, `Sub`, `Decks`, `Power`, `Setup Time`, `Footprint`) but several values are `SPEC_VALUE_HERE` placeholders (exact driver sizes, power capacity, setup time, footprint dimensions weren't specified).
- **Social links/email**: `INSTAGRAM_URL_HERE` and `contact@EMAIL_HERE` placeholders throughout — the whole site pulls from `content/site.ts`, so updating them there updates every usage at once (header, footer, home, book page).
- **`site.seo.siteUrl`**: left as `SITE_URL_HERE`; once you have a real domain, set it there so Open Graph image URLs resolve correctly instead of falling back to `localhost`.
- **Sitemap/robots.txt**: not included — wasn't in the brief, easy to add later via Next's `app/sitemap.ts` / `app/robots.ts` conventions if wanted.
- **Images use a plain `<img>` tag**, not `next/image` — a deliberate choice for the static export (no image-optimization server), not an oversight.
