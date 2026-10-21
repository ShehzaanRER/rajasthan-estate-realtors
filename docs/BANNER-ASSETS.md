# Website banners — admin guide and asset brief

Banners are managed in **Payload › Website › Website Banners**. Photography,
heading, gold line, eyebrow, description, button and layout are all editable
there; no code change is needed to change a banner. The second half of this
file is the art-direction brief for producing the photographs.

Banners are decorative brand photography. They never depict a real RER
listing, a real project, a real person, or a named landmark, and they must not
be presented as any of those.

## Placements

One record per placement. The placement is chosen when the record is created
and is locked afterwards.

| Placement | Appears on | Needs an image to publish |
| --- | --- | --- |
| Homepage — hero | `/` hero, above the property search | yes |
| Homepage — Our Story image | `/` "A legacy built on trust" photograph | yes |
| Properties page | `/properties` | no — navy header without one |
| Properties page — Rent / Lease filter | `/properties?for=rent` and `?for=lease` | no |
| Properties page — Commercial filter | `/properties?category=commercial` (wins over rent) | no |
| Projects page | `/projects` | no |
| About Us page | `/about` | no |
| Contact Us page | `/contact` | no |

`scripts/seed-website-banners.ts` has already created a **draft** for every
placement, pre-filled with the site's current wording and no images. Drafts are
invisible on the website.

## Editing a banner

1. Open the placement's record (or **Create New** if it has none — choose the
   Placement first).
2. **Images** tab
   - **Desktop Image** — *Choose from existing* to pick a Media file, or
     *Create new* to upload one. It is stored in the shared Media library and
     served through the same optimised pipeline as property photos.
   - **Mobile Image** (optional) — a portrait crop for screens under 768px.
     Without it, phones get the desktop image, re-cropped.
   - **Focal Position** / **Mobile Focal Position** — which part of the
     photograph stays in frame when it is cropped.
   - **Image Description** — Our Story only (its photograph is content; the
     others are background behind the heading and are hidden from screen
     readers).
3. **Content** tab — Eyebrow, Heading (required), Heading — Gold Line,
   Description, and **Show button** with Button Text and Button Link. Links
   must be a site path (`/properties?for=rent`), a full `https://` address, or
   `tel:` / `mailto:`. Plain text only. On the hero, the button is the gold
   "Explore Properties" button; "Speak With Us" and the search are fixed.
4. **Layout** tab — Overlay Strength (Light / Standard / Strong) and, on page
   headers, Text Alignment (Left / Centred).
5. **Save Draft** to keep work in progress without changing the site, or
   **Publish** to put it live. The **Preview** button opens the page the banner
   appears on (it shows the published version, not an unsaved draft).

**Replacing a photograph:** choose a different Desktop/Mobile Image and
publish. The old file stays in Media until you delete it there.

**Taking a banner off the site:** untick **Show on Website** (sidebar) and
publish — the page returns to its built-in design. Or use *Unpublish*. Deleting
the record has the same effect.

## How the website chooses what to show

- Only a record that is **published** *and* has **Show on Website** ticked is
  used. Drafts, unpublished and disabled records are never shown — not on the
  page and not through the public API.
- A placement with no such record shows its **built-in design**: the wording
  it had before banners were editable, and no photograph (the homepage hero and
  Our Story keep their current interim photograph until theirs is published).
- The Rent/Lease and Commercial filter placements fall back to the **Properties
  page** record when they have none, and borrow its photograph when theirs has
  no image. No other page ever borrows another page's banner.
- If a published banner's image is deleted from Media, the banner shows without
  a photograph rather than a broken image.

## When changes appear

Publishing, unpublishing or deleting a banner refreshes its page immediately.
`/` and `/about` are pre-built pages, and the publish refreshes exactly that
page; `/properties`, `/projects` and `/contact` are rendered per visit anyway.
Saving a draft refreshes nothing. Limits are in `docs/CLAUDE/DECISIONS.md`.

## Producing a photograph

1. Produce the master (prompt below), ideally PNG, at least as large as the
   master size listed.
2. Export it:
   ```bash
   node scripts/prepare-banner.mjs path/to/master.png properties-hero
   node scripts/prepare-banner.mjs path/to/master-tall.png home-hero-mobile --mobile
   ```
   This writes `banner-exports/<name>.webp` (gitignored; ≤2560px wide, or
   ≤1080px with `--mobile`, WebP q82, metadata stripped) and refuses to
   overwrite an existing file without `--force`.
3. Upload it as the Desktop (or Mobile) Image on the placement's record, set
   the focal position if the subject drifts under the text, and publish.
4. Check the page at 1440px, 1024px, 768px and 375px.

## Where text sits

Every banner holds its text in the **left ~55%** from 768px up; a navy fade runs
left to right behind it. Below 768px the text spans the full width under a
uniform 65% navy overlay. So, for every image:

- the subject belongs in the **right 40%** of the frame;
- the left half should be calm — sky, soft foliage, plain wall — not busy detail;
- the banner is cropped to roughly **3:1** on desktop, so keep everything that
  matters inside the **vertical middle 70%** of a 21:9 master.

The homepage hero is taller (headline, two buttons and the property-search
panel), roughly **16:10** on desktop and very tall on phones; its lower third
sits under the search panel and should be quiet and dark.

## Sizes

| Key | File(s) | Master | Notes |
| --- | --- | --- | --- |
| `home` | `home-hero.webp`, `home-hero-mobile.webp` | 2560×1440 (16:9); mobile 1080×1920 (9:16) | Mobile crop is worth it: the phone hero is ~3× taller than wide |
| `properties` | `properties-hero.webp` | 2560×1100 (21:9) | Mobile handled by `mobilePosition` |
| `rentals` | `rentals-hero.webp` | 2560×1100 | Shown for `/properties?for=rent` and `?for=lease`; falls back to `properties` until added |
| `commercial` | `commercial-hero.webp` | 2560×1100 | Shown for `/properties?category=commercial`; falls back to `properties` |
| `projects` | `projects-hero.webp` | 2560×1100 | |
| `about` | `about-hero.webp` | 2560×1100 | |
| `contact` | `contact-hero.webp` | 2560×1100 | |

A separate `*-mobile` portrait (1080×1350, 4:5) is only worth producing for a
page banner if the 21:9 image loses its subject at 375px even with
`mobilePosition`.

## House style — append to every prompt

> Photorealistic editorial architectural photograph, full-frame camera, 24mm
> tilt-shift lens, verticals corrected, natural light, realistic concrete,
> glass, stone and timber, true-to-life muted colour with gentle contrast and
> soft warm highlights. Contemporary Mumbai, India. Plausible Indian
> metropolitan architecture and greenery. No legible text, signage, logos,
> number plates or watermarks. No people in focus. No HDR look, no lens flare,
> no oversaturation, no futuristic or impossible architecture, no skyline
> collage.

Generate the set in one session with the same model and settings so the
lighting and colour read as one family.

## Prompts

**`home` — the established-consultancy hero**
> Late golden hour. A contemporary 20–30 storey residential tower in a leafy
> Mumbai western-suburb neighbourhood, seen from street level at a low
> three-quarter angle. Light warm-grey façade, glazed balconies with planters,
> a few windows warmly lit. Mature rain trees and gulmohar line the road.
> Clear soft evening sky. Tower on the right third of the frame; the left
> half is open sky and soft-focus foliage. The lower third is quiet and in
> shade (tree canopy, compound wall).
>
> *Mobile (9:16):* same scene recomposed vertically, tower filling the upper
> half, shaded street and canopy in the lower half.

**`properties` — general listings**
> Morning light on a calm, tree-lined residential lane with well-kept 8–14
> storey apartment buildings: painted concrete, balconies with grilles and
> plants, a compound gate and a guard cabin without signage. Buildings recede
> along the right side of the frame; the left side is soft foliage and sky.
> Orderly, lived-in, aspirational but realistic.

**`rentals` — comfortable, practical living**
> Afternoon light in a well-maintained, tastefully furnished two-bedroom
> Mumbai apartment living room: neutral fabric sofa, light vitrified-tile or
> timber floor, a rug, indoor plants, sheer curtains. A sliding door on the
> right opens to a small balcony with a view of neighbouring residential
> buildings and treetops. The left side of the frame is a softly lit plain
> wall. Uncluttered, homely, not a show flat.

**`commercial` — practical, credible business premises**
> Early evening. A modern mid-rise commercial building in Mumbai's western
> suburbs: glass and aluminium-panel façade, lit office floors above, a
> street-facing ground floor of clean retail frontages with blank fascia
> boards. Building on the right of the frame, seen at a gentle angle from
> across the road; the left side is open dusk sky and soft streetlight bokeh.

**`projects` — developments (illustrative, never a specific project)**
> Early-morning haze. A new residential tower in the final stage of
> construction beside a completed sister tower: tower crane, formwork on the
> top floors, a clean site hoarding with no text. Composition on the right
> of the frame; the left side is pale sky. Optimistic, orderly, credible.

**`about` — continuity since 1988**
> Warm late-afternoon light on a quiet suburban street. In the foreground
> right, a well-kept older Mumbai co-operative housing society building of
> the 1980s — modest, painted, with balconies and mature trees — and rising
> behind it a contemporary residential tower. The two read as one
> neighbourhood across decades. Left side of the frame: soft foliage and sky.
> Dignified, timeless, unsentimental.

**`contact` — welcoming, approachable**
> Dusk. The entrance of a well-kept residential building: a warmly lit lobby
> seen through glass doors, stone steps, potted palms, a neat compound with
> soft path lights. Entrance on the right of the frame; the left side is
> deep evening sky and shadowed foliage. Inviting, calm, "arriving home".

## Review checklist before committing an image

- Indian context holds up: building styles, vegetation, grilles, compound
  walls — nothing that reads as another country.
- No garbled pseudo-text anywhere (generators produce it on signs, hoardings
  and number plates; reject or retouch).
- No warped geometry — window grids, balcony rails and verticals stay true.
- The subject is clear of the text column at 1440px and 375px.
- Heading contrast is fine under the overlay (it is designed to be; check
  anyway on unusually bright images).
- The set reads as one family: same time-of-day palette, same lens character.

## Not covered by this set

- **Locality pages** do not exist (locality is a `/properties` filter), so no
  locality banners are planned. Locality-specific imagery would also need
  verifiable photographs of each place, not generated ones.
- **Property and project detail pages** lead with the listing's own
  photography and keep their existing breadcrumb header; they take no banner.
- **Privacy, Terms and the 404** keep their compact navy header.
- **Our Story image** (`home/AboutTeaser`) is now its own placement. It shows
  the interim Unsplash photograph until its record is published; a calm
  interior detail at 3:2, 1600×1067 or larger, suits its 576px column.
