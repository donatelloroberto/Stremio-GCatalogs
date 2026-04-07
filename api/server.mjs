/**
 * Vercel serverless function entry.
 * Imports the compiled Express app and re-exports it as the default handler.
 *
 * The api-server build output (dist/index.mjs) calls app.listen() which
 * is unsuitable for serverless. This file instead builds only the app
 * (without listen) via a separate esbuild step defined in vercel.json.
 *
 * At deploy time, Vercel runs `pnpm vercel:build` which produces
 * `api/dist/server.mjs` — that file is what Vercel actually invokes.
 *
 * Local dev: `pnpm --filter @workspace/api-server run dev` still works normally.
 */

import app from "../artifacts/api-server/dist/server.mjs";

export default app;
