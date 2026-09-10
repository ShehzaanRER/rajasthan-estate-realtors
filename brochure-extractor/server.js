const express = require("express");
const multer = require("multer");
const archiver = require("archiver");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const { getPdfInfo, extractPageText, renderPage, PasswordProtectedError, InvalidPdfError } = require("./lib/pdf");
const { classifyPage } = require("./lib/classify");
const { sanitizeSlug, sanitizeFilename } = require("./lib/sanitize");
const { createSession, getSession, destroySession, sweepStaleSessions } = require("./lib/sessions");

const PORT = process.env.PORT || 4100;
const MAX_UPLOAD_BYTES = 60 * 1024 * 1024; // 60MB
const MAX_PAGES = 150; // abuse guard

// Photographic categories render as high-quality JPEG (smaller, no visible
// loss at quality=92). Text/line-art heavy categories stay lossless PNG.
const JPEG_CATEGORIES = new Set([
  "building-exterior",
  "building-exterior-night",
  "building-interior",
  "living-room",
  "bedroom",
  "kitchen",
  "bathroom",
  "amenities",
  "swimming-pool",
  "clubhouse",
  "gym",
  "landscape",
  "commercial-office",
  "commercial-shop",
  "retail",
  "construction",
  "other",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function isPdfBuffer(buf) {
  return buf && buf.length > 4 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

// ---- 1. Upload + inspect (fast: page count, no rendering) ----------------
app.post("/api/inspect", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file was uploaded." });
    }
    if (!isPdfBuffer(req.file.buffer)) {
      return res.status(400).json({ error: "The uploaded file is not a valid PDF." });
    }

    const session = await createSession();
    const pdfPath = path.join(session.dir, "source.pdf");
    await fsp.writeFile(pdfPath, req.file.buffer);
    session.pdfPath = pdfPath;

    let info;
    try {
      info = await getPdfInfo(pdfPath);
    } catch (err) {
      await destroySession(session.id);
      if (err instanceof PasswordProtectedError) {
        return res.status(400).json({ error: "This PDF is password-protected. Please upload an unlocked PDF." });
      }
      return res.status(400).json({ error: "Could not read this PDF. It may be corrupted or invalid." });
    }

    if (!info.pageCount || info.pageCount < 1) {
      await destroySession(session.id);
      return res.status(400).json({ error: "This PDF has no readable pages." });
    }
    if (info.pageCount > MAX_PAGES) {
      await destroySession(session.id);
      return res.status(400).json({ error: `This PDF has ${info.pageCount} pages, which exceeds the ${MAX_PAGES}-page limit.` });
    }

    session.pageCount = info.pageCount;
    const originalBase = req.file.originalname.replace(/\.pdf$/i, "");
    const projectName = sanitizeSlug(originalBase, "brochure");

    res.json({ sessionId: session.id, pageCount: info.pageCount, projectName });
  } catch (err) {
    console.error("inspect failed:", err);
    res.status(500).json({ error: "Unexpected error while reading the PDF." });
  }
});

// ---- 2. Convert: render every page + classify -----------------------------
app.post("/api/convert/:sessionId", async (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.pdfPath) {
    return res.status(404).json({ error: "Session not found or expired. Please upload the PDF again." });
  }

  const pagesDir = path.join(session.dir, "pages");
  await fsp.mkdir(pagesDir, { recursive: true });

  const rawPages = [];
  for (let pageNumber = 1; pageNumber <= session.pageCount; pageNumber++) {
    const pageIndex = pageNumber - 1;
    let category = "other";
    try {
      const text = await extractPageText(session.pdfPath, pageNumber);
      category = classifyPage({ text, pageIndex, pageCount: session.pageCount });
    } catch {
      category = "other";
    }

    const format = JPEG_CATEGORIES.has(category) ? "jpg" : "png";
    let filePath = null;
    let failed = false;
    try {
      filePath = await renderPage(session.pdfPath, pageNumber, pagesDir, format);
    } catch (err) {
      console.error(`render failed for page ${pageNumber}:`, err.message);
      failed = true;
    }

    rawPages.push({ pageIndex, pageNumber, category, format, filePath, failed });
  }

  // Assign human-friendly filenames. Categories that occur more than once
  // get a per-category running suffix; a category that occurs once doesn't.
  const countsByCategory = {};
  for (const p of rawPages) {
    if (p.failed) continue;
    countsByCategory[p.category] = (countsByCategory[p.category] || 0) + 1;
  }
  const seenSoFar = {};
  const pages = rawPages.map((p) => {
    if (p.failed) {
      return { index: p.pageIndex, pageNumber: p.pageNumber, category: p.category, failed: true };
    }
    seenSoFar[p.category] = (seenSoFar[p.category] || 0) + 1;
    const needsSuffix = countsByCategory[p.category] > 1;
    const suffix = needsSuffix ? `-${String(seenSoFar[p.category]).padStart(2, "0")}` : "";
    const filename = `${String(p.pageNumber).padStart(2, "0")}-${p.category}${suffix}.${p.format}`;
    return {
      index: p.pageIndex,
      pageNumber: p.pageNumber,
      category: p.category,
      filename,
      format: p.format,
      previewUrl: `/api/preview/${session.id}/${p.pageIndex}`,
      failed: false,
    };
  });

  session.pages = rawPages;
  res.json({ pages });
});

// ---- 3. Serve rendered page image for thumbnail/preview -------------------
app.get("/api/preview/:sessionId/:index", async (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).end();
  const index = parseInt(req.params.index, 10);
  const page = (session.pages || []).find((p) => p.pageIndex === index);
  if (!page || page.failed || !page.filePath) return res.status(404).end();
  res.setHeader("Content-Type", page.format === "jpg" ? "image/jpeg" : "image/png");
  fs.createReadStream(page.filePath).pipe(res);
});

// ---- 4. Build + download ZIP, then clean up temp files ---------------------
app.post("/api/zip/:sessionId", async (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found or expired. Please upload the PDF again." });
  }

  const { projectName, files } = req.body || {};
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "No files to include in the ZIP." });
  }

  const folderName = sanitizeSlug(projectName, "brochure");

  const seenNames = new Set();
  const resolved = [];
  for (const f of files) {
    const page = (session.pages || []).find((p) => p.pageIndex === f.index);
    if (!page || page.failed || !page.filePath) continue;
    const name = sanitizeFilename(f.filename, `page-${page.pageIndex + 1}`, page.format);
    if (seenNames.has(name)) {
      return res.status(400).json({ error: `Duplicate filename detected: "${name}". Please make filenames unique before downloading.` });
    }
    seenNames.add(name);
    resolved.push({ name, filePath: page.filePath });
  }

  if (resolved.length === 0) {
    return res.status(400).json({ error: "No valid rendered pages to include in the ZIP." });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${folderName}.zip"`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    console.error("zip generation failed:", err);
    if (!res.headersSent) res.status(500);
    res.end();
  });
  // Register the cleanup listener before finalizing: for small archives the
  // response can finish streaming before `archive.finalize()`'s promise
  // resolves, so attaching this after the await risks missing the event.
  res.on("finish", () => {
    destroySession(session.id).catch(() => {});
  });

  archive.pipe(res);
  for (const item of resolved) {
    archive.file(item.filePath, { name: `${folderName}/${item.name}` });
  }
  await archive.finalize();
});

// ---- 5. Explicit reset ------------------------------------------------------
app.delete("/api/session/:sessionId", async (req, res) => {
  await destroySession(req.params.sessionId);
  res.status(204).end();
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: `File is too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.` });
  }
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

setInterval(() => sweepStaleSessions().catch(() => {}), 10 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`RER Brochure Image Extractor running at http://localhost:${PORT}`);
});
