@AGENTS.md

# RER — Development Guide

This repository is the **Rajasthan Estate Realtors (RER)** website: a Next.js
public site and a Payload CMS admin panel running as one application.

## Ground rules

1. **Payload is the source of truth for property content.** Listings,
   projects, amenities, partners and media are CMS records. Never hardcode
   inventory, partner logos or other editable content into React components.
2. **Properties and Projects are separate concepts.** A Property is a single
   physical unit; a Listing is one sale/rent/lease of it (price, terms, status
   and URL live on the Listing); a Project is a development. They have separate
   collections, separate data layers, separate routes and separate status
   vocabularies. Do not couple them casually.
3. **Preserve the existing architecture** unless the requested change
   explicitly requires otherwise.
4. **Do not refactor unrelated code** while implementing a focused feature.
5. **Do not add dependencies** when what the project already has is
   sufficient. Check `package.json` and the existing patterns first.

## How to work in this repo

6. **Read the relevant files in `docs/CLAUDE/` before changing anything.**
   They exist so you do not have to rediscover the architecture every session.
7. Use that documentation to identify the source files that matter.
8. **Inspect only those files.** Do not run repository-wide scans by default.
9. **If the documentation disagrees with the code, the code wins** — then fix
   the documentation as part of your change.

## After implementing

10. Update the affected files in `docs/CLAUDE/`.
11. Record architectural decisions in `docs/CLAUDE/DECISIONS.md`.
12. Record significant changes in `docs/CLAUDE/CHANGELOG.md`, concisely.

## Documentation map

| File | Covers |
| --- | --- |
| `docs/CLAUDE/ARCHITECTURE.md` | App structure, CMS wiring, media pipeline, data layer |
| `docs/CLAUDE/DATA-MODEL.md` | Collections, important fields, relationships |
| `docs/CLAUDE/PUBLIC-ROUTES.md` | Public routes, what powers them, visibility rules |
| `docs/CLAUDE/DECISIONS.md` | Architectural decisions and their reasoning |
| `docs/CLAUDE/CHANGELOG.md` | Significant changes, newest first |
| `docs/BANNER-ASSETS.md` | Website Banners admin guide (placements, publishing, fallbacks) and photography brief |
| `docs/NEW-LAPTOP-SETUP.md` | Environment variables, prerequisites, where the database and media actually live |
| `docs/LISTINGS-ROLLOUT.md` | Production procedure for the listings change (backup + restore check, reviewed SQL in `docs/listings-schema*.sql`, migration, verification SQL in `docs/listings-verify-*.sql`, rollback), day-to-day listing workflow, AppSheet/Sheets notes |

`docs/MEMORY.md` is a separate, human-owned record of business and brand
context. Do not edit it without explicit approval. `docs/PRD.md`,
`docs/PHASES.md` and `docs/COMPETITORS.md` are likewise product documents, not
agent documentation.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

### How to invoke it on this machine

**There is no `graphify` on PATH, and it is not an npm package** — `npx graphify`
and `command -v graphify` both fail. It is the Python package `graphifyy`,
installed with `uv tool`. The skill records the interpreter that can import it in
`graphify-out/.graphify_python`, which is the reliable way to find it:

```bash
PYTHONHASHSEED=0 "$(cat graphify-out/.graphify_python)" -m graphify <command>
```

`PYTHONHASHSEED=0` is load-bearing on Windows, not decoration. graphify pins the
hash seed for deterministic clustering by re-executing itself via `os.execvpe`
(`graphify/__main__.py`, `_pin_hash_seed_if_needed`). Windows has no real `exec`
and that call dies with an access violation — exit `-1073741819` / `139`, often
with **no output at all**, sometimes after the work has already been done by the
child process. The function's own `except OSError` guard does not catch a native
crash, so it fails hard instead of degrading. Setting the variable makes the
function return early, skipping the re-exec while pinning the exact seed it
wanted.

Read the commands below as taking that prefix. Substitute the real path when
writing a command for a human to run.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- **No LLM backend is configured here** (no `GEMINI_API_KEY`, `GOOGLE_API_KEY`,
  `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`), so community names are hub filenames
  such as `mapProject.ts`, never descriptive LLM-written names. `graphify label`
  therefore costs nothing and changes nothing — do not run it expecting better
  names, and do not read the "run `graphify label` to refresh names with the LLM"
  hint after an update as something actionable. It becomes real only once a key
  is set.
