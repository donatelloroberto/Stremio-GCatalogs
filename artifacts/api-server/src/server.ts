/**
 * Vercel serverless entry point.
 * Exports the Express app WITHOUT calling listen() — Vercel handles that.
 * Named "server.ts" so esbuild naturally outputs "server.mjs".
 */
import app from "./app";

export default app;
