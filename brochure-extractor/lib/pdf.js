// Thin wrappers around the Poppler command-line tools (pdfinfo, pdftotext,
// pdftoppm). Poppler is a mature, widely-available PDF toolkit and gives
// reliable, high-DPI, aspect-ratio-preserving rendering without pulling in a
// browser or a heavy PDF engine.

const { execFile } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const RENDER_DPI = 300;
const EXEC_OPTS = { maxBuffer: 1024 * 1024 * 64, timeout: 60_000 };

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { ...EXEC_OPTS, ...opts }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

class PasswordProtectedError extends Error {}
class InvalidPdfError extends Error {}

async function getPdfInfo(pdfPath) {
  try {
    const { stdout } = await run("pdfinfo", [pdfPath]);
    const pages = /^Pages:\s+(\d+)/m.exec(stdout);
    const sizeMatch = /^Page size:\s+([\d.]+)\s*x\s*([\d.]+)\s*pts/m.exec(stdout);
    const encrypted = /^Encrypted:\s+yes/m.test(stdout);
    return {
      pageCount: pages ? parseInt(pages[1], 10) : 0,
      widthPts: sizeMatch ? parseFloat(sizeMatch[1]) : null,
      heightPts: sizeMatch ? parseFloat(sizeMatch[2]) : null,
      encrypted,
    };
  } catch (err) {
    const msg = `${err.message || ""} ${err.stderr || ""}`.toLowerCase();
    if (msg.includes("password") || msg.includes("incorrect password")) {
      throw new PasswordProtectedError("This PDF is password-protected.");
    }
    throw new InvalidPdfError("Could not read this PDF. It may be corrupted or invalid.");
  }
}

async function extractPageText(pdfPath, pageNumber) {
  try {
    const { stdout } = await run("pdftotext", [
      "-f", String(pageNumber),
      "-l", String(pageNumber),
      "-layout",
      pdfPath,
      "-",
    ]);
    return stdout || "";
  } catch {
    // Text extraction failing must not block conversion.
    return "";
  }
}

/**
 * Renders a single page to PNG or JPEG at RENDER_DPI, preserving the
 * original page aspect ratio and dimensions (Poppler derives pixel
 * dimensions from the page's own size at the given DPI).
 */
async function renderPage(pdfPath, pageNumber, outDir, format) {
  const prefix = path.join(outDir, `page`);
  const args = ["-f", String(pageNumber), "-l", String(pageNumber), "-r", String(RENDER_DPI)];
  if (format === "jpg") {
    args.push("-jpeg", "-jpegopt", "quality=92");
  } else {
    args.push("-png");
  }
  args.push(pdfPath, prefix);

  await run("pdftoppm", args);

  // pdftoppm names output "<prefix>-<pageNumber>.<ext>" (or with leading
  // zeros depending on total page count). Find whichever it produced.
  const ext = format === "jpg" ? "jpg" : "png";
  const files = await fs.readdir(outDir);
  const match = files.find((f) => f.startsWith("page") && f.endsWith(`.${ext}`));
  if (!match) {
    throw new Error(`pdftoppm did not produce an output file for page ${pageNumber}`);
  }
  const finalPath = path.join(outDir, `rendered-${pageNumber}.${ext}`);
  await fs.rename(path.join(outDir, match), finalPath);
  return finalPath;
}

module.exports = {
  RENDER_DPI,
  getPdfInfo,
  extractPageText,
  renderPage,
  PasswordProtectedError,
  InvalidPdfError,
};
