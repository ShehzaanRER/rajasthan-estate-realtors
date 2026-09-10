// Filesystem-safe name sanitization: lowercase, hyphenated, no unsafe characters.

function sanitizeSlug(input, fallback = "untitled") {
  const slug = String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/\.[a-z0-9]+$/i, "") // drop trailing extension if present
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

function sanitizeFilename(input, fallbackBase, ext) {
  const raw = String(input || "");
  const extMatch = raw.match(/\.([a-z0-9]+)$/i);
  const base = sanitizeSlug(raw, fallbackBase);
  const finalExt = extMatch ? extMatch[1].toLowerCase() : ext;
  const safeExt = finalExt === "jpg" || finalExt === "jpeg" ? "jpg" : "png";
  return `${base}.${safeExt}`;
}

module.exports = { sanitizeSlug, sanitizeFilename };
