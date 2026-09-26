# Setting RER up on a new laptop

Audited and verified 2026-09-26.

## Read this first: what actually has to move

The RER database and every media file live in **Supabase cloud**, not on any
laptop. There is no local PostgreSQL install, and the repo's `media/` folder is
empty and gitignored. So there is **no database to restore and no media to
copy** — the new machine points at the same cloud resources with the same
credentials.

| Thing | How it moves | Effort |
| --- | --- | --- |
| Source code, git history | `git clone` from GitHub | trivial |
| **`.env` (11 values)** | **Manual, secure copy. Exists nowhere else.** | **the only real step** |
| PostgreSQL schema, data, sequences | Nothing to do — hosted on Supabase | none |
| Media files (120 objects, 85 MB) | Nothing to do — hosted in Supabase Storage | none |
| Node, npm | Install on the new machine | small |
| PostgreSQL server | **Not needed at all** | none |

If you copy nothing but `.env` off the old laptop, everything else is
recoverable. If you lose `.env`, see [Rebuilding `.env` from scratch](#rebuilding-env-from-scratch).

## Prerequisites

| Software | Version verified working | Notes |
| --- | --- | --- |
| Node.js | **24.21.0** | Next 16 + Payload 3. Use Node 24 LTS; do not go below 20.9. |
| npm | 11.19.0 | Ships with Node 24. |
| Git | any recent | Uses HTTPS, not SSH (see below). |
| PostgreSQL server | **not required** | The database is remote. |
| PostgreSQL **client tools** | optional | Only if you want real `pg_dump` backups — not installed on the old laptop either. |

Optional developer tooling: VS Code or Cursor, Claude Code. `graphify` is a
Python tool (`uv tool install graphifyy`) — see the caveat at the bottom.

## Step 1 — Install Git and Node

Install Node 24 LTS and Git, then confirm:

```bash
node -v && npm -v && git --version
```

## Step 2 — Configure your git identity

The old laptop used:

```bash
git config --global user.name "ShehzaanRER"
git config --global user.email "shehzaanzamindar08@gmail.com"
```

## Step 3 — Authentication (HTTPS, not SSH)

The remote is `https://github.com/ShehzaanRER/rajasthan-estate-realtors`, and the
old laptop authenticated with Git Credential Manager (`credential.helper=manager`).
No SSH key is involved, so **there is no private key to migrate**.

On the new laptop, the first `git push` opens a browser sign-in to GitHub. If you
prefer a token instead, create a fine-grained PAT with `Contents: read/write` on
this repo and paste it when git asks for a password.

## Step 4 — Clone

```bash
git clone https://github.com/ShehzaanRER/rajasthan-estate-realtors.git
```

```bash
cd rajasthan-estate-realtors
```

## Step 5 — Install dependencies

Use `npm ci` — it installs exactly what `package-lock.json` pins:

```bash
npm ci
```

`sharp` compiles a native binary during install; this is normal and needs no
extra toolchain on Windows or macOS.

## Step 6 — Create `.env`

Copy the template, then fill in the real values from the old laptop's `.env`
(or from the migration backup bundle's `env.SECRET.txt`):

```bash
cp .env.example .env
```

### Every variable the application reads

| Variable | Used by | Required | Scope | Where the value comes from |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | `payload.config.ts` | **yes** | server | Supabase → Project Settings → Database → connection string (pooler, port 5432) |
| `PAYLOAD_SECRET` | `payload.config.ts` | **yes** | server | Existing value. Signs admin sessions — **reuse it**, don't invent a new one, or everyone is logged out |
| `S3_BUCKET` | `payload.config.ts` | **yes** | server | `rer-media` |
| `S3_ENDPOINT` | `payload.config.ts` | **yes** | server | Supabase → Project Settings → Storage → S3 connection |
| `S3_REGION` | `payload.config.ts` | **yes** | server | `ap-south-1` |
| `S3_ACCESS_KEY_ID` | `payload.config.ts` | **yes** | server | Supabase → Storage → S3 access keys |
| `S3_SECRET_ACCESS_KEY` | `payload.config.ts` | **yes** | server | Same. Shown once at creation; regenerate if lost |
| `NEXT_PUBLIC_SITE_URL` | `next.config.mjs`, `lib/siteConfig.ts` | **yes for `npm run build`** | public | `http://localhost:3000` locally; `https://rajasthanestaterealtors.in` in production |
| `GOOGLE_MAPS_API_KEY` | admin Nearby Search endpoint | for that feature | server | Google Cloud Console → Places API (New). **See the security note below** |
| `NEXT_PUBLIC_ANALYTICS_SRC` | `components/Analytics.jsx` | no | public | Intentionally blank — keeps the site cookie-banner-free |
| `NEXT_PUBLIC_ANALYTICS_DOMAIN` | `components/Analytics.jsx` | no | public | Intentionally blank |
| `VITE_GOOGLE_API_KEY`, `VITE_GOOGLE_PLACE_ID` | nothing | **no** | — | Dead. Leftovers from the pre-Next Vite build; safe to omit |
| `GOOGLE_API_KEY`, `GOOGLE_PLACE_ID` | `server/index.js` only | **no** | server | Dead. The `server/` Express app is not part of the live site |

`NEXT_PUBLIC_SITE_URL` is easy to miss: without it `npm run build` **fails on
purpose** (`payload.config.ts` throws), because the silent fallback would publish
`localhost` as the site's canonical identity. The old laptop's `.env` was missing
it and its build was broken until 2026-09-26.

Everything without a `NEXT_PUBLIC_` prefix is server-side only. Never add that
prefix to a secret — it would be inlined into the browser bundle.

## Step 7 — Database: nothing to restore, just verify

Payload owns the schema and creates what it needs on boot. There are **no
`migrations/` files** in this repo and no migrate script; the database already
exists remotely with its schema in place. Do not run migrations against it
looking for something to do.

Start the app (Step 8) and confirm `/admin` lists your properties. That single
check proves the connection string, the schema and the data all work.

### Property IDs and sequences — why these are safe

`RER-00001`-style IDs come from the PostgreSQL sequence `rer_property_id_seq`
(projects use `rer_project_id_seq`), allocated by `nextval()` in
`collections/hooks/assignPropertyId.ts`. Both sequences live **in the Supabase
database**, so they move with it automatically — there is nothing to migrate and
no possibility of duplicate IDs from changing laptops.

Verified on 2026-09-26:

```
rer_property_id_seq = 22   highest stored = RER-00022   (22 properties)
rer_project_id_seq  = 7    highest stored = RER-P-0007   (7 projects)
```

Both exactly in sync, so the next property created is `RER-00023`. Existing IDs
are stored values in their rows and are never rewritten — `assignPropertyId`
returns the original on every update.

There is also a safety net for the one case that *would* be dangerous, a
database restored from a dump (sequence state is not carried by table data):
`collections/hooks/syncIdSequence.ts` runs on every boot and advances each
sequence past the highest stored ID. It only ever moves forward, so it cannot
re-issue an ID that has already been handed out.

## Step 8 — Run it

```bash
npm run dev
```

The public site and the Payload admin are one Next.js app on **port 3000**:

- site — `http://localhost:3000`
- admin — `http://localhost:3000/admin`

Port 3000 is not hardcoded in the application; it is Next's default and what
`.claude/launch.json` expects. `next dev -p 3001` works if 3000 is taken.

## Step 9 — Validate

Work down this list. Every item exercises a different part of the stack.

| Check | Confirms |
| --- | --- |
| Homepage loads, featured properties appear | DB connection + `getFeaturedProperties` |
| Property photos render (not broken images) | Supabase Storage keys + `/api/media/file/...` |
| `/properties` listing, then filter by locality/BHK | Query layer and filter params |
| Open one property detail page | Slug routing + `mapProperty` |
| `/projects` and a project detail page | The separate Projects pipeline |
| Sign in at `/admin` | `PAYLOAD_SECRET` + the existing users table (2 users) |
| Admin console tiles show non-zero counts | `lib/admin-console` reads live data |
| Media → browse a folder | Media folders keyed by RER ID |
| Create a draft property, check its ID is `RER-00023` | Sequence allocation works |
| Admin → a project's Nearby Search | `GOOGLE_MAPS_API_KEY` |
| Contact form submits | `POST /api/contact` + rate limiter |

## Step 10 — Build

```bash
npm run build
```

Expect a `[RER] NEXT_PUBLIC_SITE_URL is "http://localhost:3000"` warning on a
local production build. That is the intended warning, not an error.

Also available:

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

All three passed on 2026-09-26.

## External services

| Service | Used for | Needed on new laptop | Credential | Configured in | Action |
| --- | --- | --- | --- | --- | --- |
| **Supabase Postgres** | The entire database | yes | `DATABASE_URL` | `.env` | Copy the value |
| **Supabase Storage** | Every image on the site | yes | 5 × `S3_*` | `.env` | Copy the values |
| **GitHub** | Source + history | yes | HTTPS browser sign-in / PAT | credential manager | Sign in on first push |
| **Google Places API (New)** | Admin Nearby Search only | only for that feature | `GOOGLE_MAPS_API_KEY` | `.env` | **Rotate — see below** |
| Railway | Production hosting | no | — | Railway dashboard | Env vars are set there, not locally |
| Analytics provider | — | no | none | `.env` (blank) | Deliberately unconfigured |

Nothing in the repo references AppSheet or Google Sheets. If such a workflow
exists it is entirely outside this codebase.

## ⚠️ Open security item: exposed Google API key

`.env` and `server/.env` were committed in **commit `0a24536`** and deleted
later in `a1b116c`, but they remain readable in git history — and this repository
is **public**. The exposed key is byte-identical to the current
`GOOGLE_MAPS_API_KEY`, so it is live and scrapable, and it can be billed to the
Google Cloud account.

Deleting the file did not help; the value is in history. The fix is in Google
Cloud Console, not in git:

1. Create a new API key, restricted to the Places API (New) and to the server's
   IP or the production domain.
2. Put the new key in `.env` and in Railway's environment variables.
3. **Delete the old key** — this is the step that actually closes the exposure.

The database password, `PAYLOAD_SECRET` and all five Supabase Storage keys were
added after that commit and were **never** committed. Those are clean and
verified.

## Rebuilding `.env` from scratch

If `.env` is lost entirely, every value is recoverable except one:

- `DATABASE_URL` — Supabase dashboard; reset the database password if unknown.
- `S3_*` — Supabase dashboard; regenerate the S3 access key.
- `GOOGLE_MAPS_API_KEY` — new key in Google Cloud Console.
- `NEXT_PUBLIC_SITE_URL` — documented in `.env.example`.
- `PAYLOAD_SECRET` — **not recoverable.** It is not stored anywhere but `.env`.
  A new value invalidates every existing admin session and any outstanding
  password-reset token; users sign in again and the app works. Password hashes
  are salted per-user and unaffected, so no account is lost.

## Backups (separate from migration)

The migration itself needs no backup, because the data is not on the laptop.
Backups protect against losing the Supabase project or a bad bulk edit.

A verified bundle was captured on 2026-09-26 into
`../rer-migration-backup-2026-09-26/`, deliberately **outside this repository**:
a read-only JSON snapshot of all 26 tables / 406 rows / 21 sequences, plus all
120 media objects (84.9 MB) byte-size-verified against the bucket. It holds
password hashes, customer contact details and live credentials, so it must never
be committed — `.gitignore` guards the obvious patterns.

That bundle is only insurance if it is **moved off the old laptop**. For an
ongoing backup story, check which retention tier the Supabase project is on —
free-tier retention is short — and consider installing the PostgreSQL client
tools so a real `pg_dump` is possible.

## Tooling caveat: graphify

`graphify-out/` is gitignored — it is 4 MB of derived graph regenerated from the
source tree, not something to restore. The skill is committed at
`.claude/skills/graphify/`, and `.claude/settings.json` registers hooks that
shell out to a bare `graphify` command.

**That command does not exist on PATH.** As the root `CLAUDE.md` explains,
graphify is the Python package `graphifyy` installed via `uv tool`, and it must
be invoked through the interpreter recorded in `graphify-out/.graphify_python`
with `PYTHONHASHSEED=0`. The hooks therefore fail harmlessly on this machine and
will do the same on the new one. Either install graphify and fix the hook
commands, or delete the `hooks` block from `.claude/settings.json`.

---

## Checklist

### Before leaving the old laptop

- [x] Working tree committed and pushed to `origin/main`
- [x] All source files tracked — including the Slug Update button component
- [x] No secrets tracked in the current tree (verified by scan)
- [x] `.env.example` present and complete
- [x] `.gitignore` covers env files, `graphify-out/`, dumps and backup folders
- [x] Database snapshot captured (26 tables, 406 rows, 21 sequences)
- [x] Media backed up (120 objects, 84.9 MB, all size-verified)
- [x] Node version documented (24.21.0), PostgreSQL documented (remote, 17.6)
- [x] External services documented
- [x] Setup documentation written
- [ ] **Copy `.env` somewhere safe** — the only laptop-only asset
- [ ] **Move `../rer-migration-backup-2026-09-26/` off this laptop**
- [ ] **Rotate the exposed Google API key** (see above)
- [ ] Confirm you can sign in to Supabase and GitHub from another device

### On the new laptop

- [ ] Install Git
- [ ] Configure `user.name` and `user.email`
- [ ] Install Node 24 LTS
- [ ] `git clone` over HTTPS
- [ ] `npm ci`
- [ ] Create `.env` from `.env.example` + the real values
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` is set (or `npm run build` fails)
- [ ] ~~Install PostgreSQL~~ — not needed
- [ ] ~~Restore database~~ — not needed, it is remote
- [ ] ~~Restore media~~ — not needed, it is remote
- [ ] `npm run dev`, sign in to `/admin`
- [ ] Walk the Step 9 validation table
- [ ] Create a test property and confirm the ID is `RER-00023`
- [ ] `npm run build`
- [ ] `git status` clean, and a test push works
