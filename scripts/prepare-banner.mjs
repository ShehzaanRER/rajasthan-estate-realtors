/**
 * Turns a generated or photographed master into a banner file for
 * banner-exports/ (gitignored), ready to upload to Media.
 *
 *   node scripts/prepare-banner.mjs <master.png|jpg> <name> [--mobile] [--force]
 *
 *   node scripts/prepare-banner.mjs ~/Downloads/props.png properties-hero
 *   node scripts/prepare-banner.mjs ~/Downloads/home-tall.png home-hero-mobile --mobile
 *
 * Output is a WebP capped at 2560px wide (1080px with --mobile), never
 * enlarged. That is a delivery master, not the size anyone downloads:
 * next/image cuts the per-device widths from it at request time. Metadata is
 * stripped (sharp's default), which also drops any generator EXIF/C2PA blocks.
 *
 * Refuses to overwrite an existing banner without --force, so a re-run cannot
 * silently replace a photograph that is already live.
 *
 * After running it, upload the file in Payload › Website Banners (Desktop or
 * Mobile Image on the placement's record) and publish. `banner-exports/` is
 * only a local staging area — the site serves banners from the Media
 * collection. See docs/BANNER-ASSETS.md for what each banner
 * should show.
 */
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith('--')));
const [input, name] = args.filter((arg) => !arg.startsWith('--'));

if (!input || !name || !/^[a-z0-9-]+$/.test(name)) {
  console.error('Usage: node scripts/prepare-banner.mjs <input> <kebab-case-name> [--mobile] [--force]');
  process.exit(1);
}

const isMobile = flags.has('--mobile');
const maxWidth = isMobile ? 1080 : 2560;
const output = path.join(process.cwd(), 'banner-exports', `${name}.webp`);

if (existsSync(output) && !flags.has('--force')) {
  console.error(`${path.relative(process.cwd(), output)} already exists. Pass --force to replace it.`);
  process.exit(1);
}

const source = await sharp(input).metadata();
if (source.width < (isMobile ? 900 : 1920)) {
  console.warn(`Warning: master is only ${source.width}px wide; it will look soft on large screens.`);
}

mkdirSync(path.dirname(output), { recursive: true });

const info = await sharp(input)
  .rotate()
  .resize({ width: maxWidth, withoutEnlargement: true })
  .webp({ quality: 82, effort: 6, smartSubsample: true })
  .toFile(output);

console.log(
  `Wrote ${path.relative(process.cwd(), output)} — ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`,
);
console.log('Now upload it in Payload › Website Banners on the matching placement, then Publish.');
