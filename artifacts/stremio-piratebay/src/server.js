/**
 * HTTP Server entry point.
 *
 * Serves the Stremio addon at PORT (default 7000).
 * EventEmitter limit raised because magnet2torrent opens many listeners.
 */

require('events').EventEmitter.defaultMaxListeners = 50;

const { serveHTTP } = require('stremio-addon-sdk');
const addonInterface = require('./addon');

const port = parseInt(process.env.PORT, 10) || 7000;

try {
    serveHTTP(addonInterface, { port });
    console.log(`[TPB Catalog] Stremio addon running on http://localhost:${port}/manifest.json`);
} catch (err) {
    console.error('[TPB Catalog] Failed to start server:', err);
    process.exit(1);
}
