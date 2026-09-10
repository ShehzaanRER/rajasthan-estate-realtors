// In-memory session registry + disk cleanup. No database by design: this is
// a small local utility and uploads are temporary.

const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const SESSIONS_ROOT = path.join(os.tmpdir(), "rer-brochure-extractor");
const MAX_SESSION_AGE_MS = 60 * 60 * 1000; // 1 hour

const sessions = new Map();

async function ensureRoot() {
  await fs.mkdir(SESSIONS_ROOT, { recursive: true });
}

async function createSession() {
  await ensureRoot();
  const id = crypto.randomUUID();
  const dir = path.join(SESSIONS_ROOT, id);
  await fs.mkdir(dir, { recursive: true });
  const session = { id, dir, createdAt: Date.now(), pdfPath: null, pageCount: 0, pages: [] };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id);
}

async function destroySession(id) {
  const session = sessions.get(id);
  if (!session) return;
  sessions.delete(id);
  await fs.rm(session.dir, { recursive: true, force: true }).catch(() => {});
}

async function sweepStaleSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > MAX_SESSION_AGE_MS) {
      await destroySession(id);
    }
  }
  // Also remove any orphaned directories left over from a previous process
  // (e.g. after a crash) that are no longer tracked in memory.
  try {
    await ensureRoot();
    const entries = await fs.readdir(SESSIONS_ROOT);
    for (const entry of entries) {
      if (!sessions.has(entry)) {
        const full = path.join(SESSIONS_ROOT, entry);
        const stat = await fs.stat(full).catch(() => null);
        if (stat && now - stat.mtimeMs > MAX_SESSION_AGE_MS) {
          await fs.rm(full, { recursive: true, force: true }).catch(() => {});
        }
      }
    }
  } catch {
    // best-effort cleanup only
  }
}

module.exports = { createSession, getSession, destroySession, sweepStaleSessions, SESSIONS_ROOT };
