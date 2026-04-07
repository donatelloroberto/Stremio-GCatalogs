# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Stremio PirateBay Addon UI (`artifacts/stremio-piratebay-ui`)
- React + Vite frontend served at `/`
- Landing page for the Stremio addon showing install URL, categories, and how-to guide

### API Server (`artifacts/api-server`)
- Express 5 server served at `/api` and `/stremio`
- `/api/healthz` — health check
- `/stremio/*` — Stremio addon endpoints (manifest, catalog, stream, meta)

### Stremio Addon Source (`artifacts/api-server/src/stremio/`)
Built-in unified, fixed, and extended Stremio PirateBay addon (merged from two original projects):
- **manifest.js** — Defines all catalogs including Gay Porn (TPB cat 506), adult catalogs for movie/series
- **categories.js** — Full TPB category list including Gay Porn (506), Porn sub-cats (501–505)
- **search-tpb.js** — apibay.org REST API client; replaces deprecated `request-promise` with `got`, retry + back-off
- **catalog-handler.js** — Catalog browsing + search; fixed Ramda v0.29 `propEq` arg order, Gay Porn routing
- **meta-handler.js** — Torrent metadata + video file listing; fixed `url-exist` with HEAD check via `got`, magnet2torrent error handling
- **stream-handler.js** — Returns `{streams:[]}` shaped responses (original returned bare `[]`); supports file index for multi-file torrents
- **tools.js** — Base64-encoded ID encode/decode utilities

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/stremio-piratebay-ui run dev` — run UI locally

## Stremio Addon Fixes (vs. originals)

### Addon 1 (piratebay-stremio-addon): REPLACED
- Used obsolete `stremio-addons` v2 SDK (not maintained)
- Required MongoDB for caching
- Movie search used raw IMDB ID instead of title as query
- No ESM support

### Addon 2 (thepiratebay-catalog): FIXED + EXTENDED
- Fixed Ramda v0.29 `propEq(key, value)` → now using direct predicates
- Fixed `url-exist` v2 API change (replaced with `got.head`)
- Fixed `Porn recent` category mapping
- Added Gay Porn (category 506) to categories list, manifest, and search routing
- Added full adult sub-category catalog (Porn HD, Porn Movies, Porn DVD, Gay Porn, etc.)
- Replaced `request-promise` with `got` (maintained, active)
- Fixed stream handler returning bare `[]` instead of `{streams:[]}` 
- Added error handling / logging to silent failure points
- Added `behaviorHints: { adult: true }` to manifest

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
