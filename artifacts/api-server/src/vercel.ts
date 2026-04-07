/**
 * Vercel serverless entry point.
 * Exports the Express app WITHOUT calling listen() — Vercel handles that.
 */
import app from "./app";

export default app;
