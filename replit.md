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
- **Build**: esbuild (CJS bundle with ESM output)

## Artifacts

### Stremio PirateBay UI (`artifacts/stremio-piratebay-ui`)
- React + Vite frontend served at `/`
- Landing page showing both addon manifest URLs, install instructions, feature descriptions
- Orange theme for Catalog Addon, purple theme for TPB+ Stream Addon

### API Server (`artifacts/api-server`)
- Express 5 server on port 8080
- Registered proxy paths: `/api`, `/stremio`, `/stremio-plus`
- `/api/healthz` — health check
- `/stremio/*` — Catalog addon (browse TPB categories)
- `/stremio-plus/*` — TPB+ stream addon (IMDB-based stream lookup)

## Stremio Addons

### Addon 1: TPB Catalog (`/stremio/manifest.json`)
Source: `artifacts/api-server/src/stremio/`

A **catalog + stream + meta** addon for browsing and searching TPB by category.
- Manifests 8 catalogs: Movies, TV, Adult (movies + series) with genre filters
- Gay Porn (TPB cat 506), all adult sub-categories (500–506, 600)
- Catalog browsing, full-text search, meta resolution, stream output

Files:
- `manifest.js` — 8 catalogs including Gay Porn, behaviorHints: { adult: true }
- `categories.js` — full category list with IDs
- `search-tpb.js` — apibay.org API client (got, retry, exponential back-off)
- `catalog-handler.js` — catalog/search handler
- `meta-handler.js` — magnet2torrent metadata + file listing
- `stream-handler.js` — `{streams:[]}` response shape, infoHash + fileIdx

Route: `artifacts/api-server/src/routes/stremio.ts`

### Addon 2: TPB+ Stream (`/stremio-plus/manifest.json`)
Source: `artifacts/api-server/src/stremio-plus/`

A **stream-only** addon (no catalogs). Searches TPB by IMDB ID and title — works with any Stremio catalog (Cinemeta, Trakt, etc.) to provide TPB streams for any movie or series.
- Searches TPB by IMDB ID, title, and episode title
- Smart episode matching for series (absolute episode, season bundles)
- Resolution/source tagging (1080p, 4K, BluRay, WEB-DL)
- Rate-limited via Bottleneck (max 15 concurrent, queue of 20)
- In-memory cache for metadata and torrent files (no MongoDB required)

Files:
- `tpb-api.js` — apibay.org search + file listing via got
- `metadata.js` — Cinemeta API lookup for title/year/episode counts
- `filter.js` — title normalization, episode matching logic
- `stream-info.js` — rich stream titles with quality/size/seeder tags
- `torrent-files.js` — file listing from TPB f.php API
- `addon.js` — buildAddonInterface(), defineStreamHandler()

Route: `artifacts/api-server/src/routes/stremio-plus.ts`

## Key Commands

- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/stremio-piratebay-ui run dev` — run UI locally
- `pnpm vercel:build` — build both for Vercel deployment

## Vercel Deployment

- `vercel.json` at root configures Vercel routing
- `artifacts/api-server/build-vercel.mjs` — builds Express app as serverless bundle → `api/dist/server.mjs`
- `api/server.mjs` — Vercel serverless function entry
- Rewrites: `/api/*`, `/stremio/*`, `/stremio-plus/*` → API serverless function
- Static files serve the React UI

## Bug Fixes vs Original Addons

### stremio-thepiratebay-plus (TPB+)
- `request` → `got` (request is deprecated/unmaintained)
- `cheerio` HTML scraper → apibay.org JSON API (more reliable, no proxies needed)
- `axios` → `got` throughout
- Removed MongoDB dependency (in-memory LRU cache)
- Removed `torrent-stream` native binding dependency (uses TPB f.php API instead)
- Full ESM conversion (compatible with esbuild bundler)

### thepiratebay-catalog
- Fixed Ramda v0.29 `propEq` argument order
- Fixed `url-exist` v2 API (replaced with `got.head()`)
- Fixed `Porn recent` category mapping
- Added Gay Porn (506) + all adult sub-categories
- Replaced `request-promise` with `got`
- Fixed stream handler returning `[]` instead of `{streams:[]}`
- Added `behaviorHints: { adult: true }` to manifest

## Jackett Note

Jackett is a C# proxy for 400+ torrent indexers. It's an optional alternative to using apibay.org directly. Not integrated (requires self-hosted Jackett instance), but the API format is:
- `GET /api/v2.0/indexers/{indexer}/results?apikey=...&Query=...`
- Can be used as a drop-in replacement for direct TPB API calls
