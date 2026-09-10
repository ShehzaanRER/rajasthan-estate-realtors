# RER Brochure Image Extractor

A small, standalone internal utility. **Not part of the Rajasthan Estate
Realtors website** — it does not import, call, or depend on any code from
the main site, and lives in its own directory with its own `package.json`.

Converts a brochure PDF into a set of high-quality, descriptively-named
image files (one per page), lets you review/rename them, and downloads
everything as a ZIP.

## How it works

- **Rendering**: each PDF page is rendered server-side at 300 DPI using
  [Poppler](https://poppler.freedesktop.org/) (`pdftoppm`), which preserves
  the original page's aspect ratio and dimensions. Text/line-art-heavy pages
  (floor plans, site plans, maps, branding) are rendered as lossless PNG;
  photographic pages (exteriors, interiors, amenities, etc.) are rendered as
  high-quality JPEG (quality 92) to keep file size reasonable without visible
  quality loss.
- **Classification**: page text is extracted with `pdftotext` and matched
  against a keyword list (e.g. "FLOOR PLAN" / "CARPET AREA" / "BHK" →
  `floor-plan`, "AMENITIES" / "CLUBHOUSE" → `amenities`, etc.). Pages with
  little or no text fall back to a positional/visual heuristic (first page
  with almost no text → `developer-branding`, otherwise → `building-exterior`
  or `other`). This is deterministic keyword matching — **no AI API is
  used**. Classification is a convenience; every filename is editable before
  download.
- **No database, no auth, no cloud storage.** Uploaded PDFs and rendered
  images live only in a per-session temp directory (`os.tmpdir()`), deleted
  automatically after the ZIP is downloaded and swept every 10 minutes for
  any session older than 1 hour.

## Prerequisites

- Node.js 18+
- Poppler command-line tools (`pdfinfo`, `pdftotext`, `pdftoppm`) on `PATH`.
  - Debian/Ubuntu: `sudo apt-get install poppler-utils`
  - macOS: `brew install poppler`

## Run it

```bash
cd brochure-extractor
npm install
npm start
```

Then open **http://localhost:4100** (override the port with `PORT=xxxx npm start`).

## Workflow

1. Drag-and-drop or choose a PDF (≤ 60MB, ≤ 150 pages).
2. Click **Convert PDF** — every page is rendered and classified.
3. Review the grid: thumbnail, detected category, and an editable filename
   per page. Duplicate or empty filenames are flagged and block download.
4. Optionally edit the output folder name (defaults to the sanitized PDF
   filename).
5. Click **Download ZIP** — you get `<folder-name>/<page-files>`. Temp files
   are deleted from the server immediately after the ZIP is sent.

## Error handling

Invalid, corrupted, password-protected, or empty PDFs are rejected with a
clear message before any rendering happens. Oversized uploads are rejected
by an upload size limit. If rendering or classification fails for an
individual page, that page is marked as failed (skipped from the ZIP) and
the rest of the document still processes normally — one bad page never
aborts the whole conversion.

## Known limitations

- Classification is keyword-based, not visual/AI-based — it can misfire on
  brochures with unusual layouts or non-English/very sparse text; that's why
  every filename stays manually editable.
- Requires Poppler CLI tools to be installed on the machine running the
  server (this keeps the dependency list tiny and avoids bundling a full PDF
  engine).
- Thumbnails in the review grid are the full 300 DPI render (scaled down by
  CSS), not a separate low-res thumbnail — fine for typical brochure page
  counts, but a very large brochure will mean a heavier results page.
- In-memory session store: restarting the server loses any in-progress
  (not-yet-downloaded) sessions; this is intentional for a stateless local
  utility.
