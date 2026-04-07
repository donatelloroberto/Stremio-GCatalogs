/**
 * Stremio PirateBay Addon — Express route mounted at /stremio
 *
 * Uses stremio-addon-sdk's getRouter() to produce an Express router from
 * the addon interface. The SDK is CJS so we access it via require (the
 * esbuild banner injects a CJS shim in the ESM output).
 */

import { Router } from "express";

import stremioManifest from "../stremio/manifest.js";
import metaHandler from "../stremio/meta-handler.js";
import catalogHandler from "../stremio/catalog-handler.js";
import streamHandler from "../stremio/stream-handler.js";

// stremio-addon-sdk is CJS — the esbuild banner polyfills `require`
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { addonBuilder, getRouter: getStremioRouter } = require("stremio-addon-sdk");

const builder = new addonBuilder(stremioManifest);
builder.defineMetaHandler(metaHandler);
builder.defineCatalogHandler(catalogHandler);
builder.defineStreamHandler(streamHandler);

const addonInterface = builder.getInterface();
const stremioExpressRouter: Router = getStremioRouter(addonInterface);

const router = Router();
router.use("/", stremioExpressRouter);

export default router;
