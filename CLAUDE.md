@AGENTS.md

# RER — Development Guide

This repository is the **Rajasthan Estate Realtors (RER)** website: a Next.js
public site and a Payload CMS admin panel running as one application.

## Ground rules

1. **Payload is the source of truth for property content.** Listings,
   projects, amenities, partners and media are CMS records. Never hardcode
   inventory, partner logos or other editable content into React components.
2. **Properties and Projects are separate concepts.** A Property is a single
   unit RER transacts on; a Project is a development. They have separate
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

`docs/MEMORY.md` is a separate, human-owned record of business and brand
context. Do not edit it without explicit approval. `docs/PRD.md`,
`docs/PHASES.md` and `docs/COMPETITORS.md` are likewise product documents, not
agent documentation.
