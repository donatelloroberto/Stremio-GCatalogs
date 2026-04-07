/**
 * Stremio Adult Sites Catalog — mounted at /stremio-adult
 *
 * Provides catalog browsing + search for IAFD, WayBig, GayDVDEmpire.
 * Streams served via TPB search by title.
 */

import { Router } from "express";
import { buildAddonInterface } from "../stremio-adult/addon.js";

// stremio-addon-sdk is CJS; the esbuild banner polyfills require
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { addonBuilder, getRouter: getStremioRouter } = require("stremio-addon-sdk");

const addonInterface = buildAddonInterface(addonBuilder);
const stremioExpressRouter: Router = getStremioRouter(addonInterface);

const router = Router();
router.use("/", stremioExpressRouter);

export default router;
