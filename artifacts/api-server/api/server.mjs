/**
 * Vercel serverless function entry point (when Vercel Root Directory = artifacts/api-server).
 * Imports the compiled Express app from the Vercel build output.
 */
import app from "../dist/server.mjs";

export default app;
