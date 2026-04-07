/**
 * Stremio TPB+ — stream-only addon mounted at /stremio-plus
 *
 * Provides TPB streams for any IMDB movie/series title.
 * Works alongside any Stremio catalog (Cinemeta, TPB Catalog, etc.)
 */

import { Router } from "express";
import { buildAddonInterface } from "../stremio-plus/addon.js";

// stremio-addon-sdk is CJS; the esbuild banner polyfills require
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { addonBuilder, getRouter: getStremioRouter } = require("stremio-addon-sdk");

const addonInterface = buildAddonInterface(addonBuilder);
const stremioExpressRouter: Router = getStremioRouter(addonInterface);

const router = Router();
router.use("/", stremioExpressRouter);

export default router;
