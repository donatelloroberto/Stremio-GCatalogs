/**
 * Stream Handler
 *
 * Returns a single torrent stream for a given item ID.
 *
 * Fixes vs. original:
 *  - Catch block now logs the error so silent failures are visible in logs
 *  - Returns { streams: [] } consistently (original returned raw [] which
 *    is not a valid Stremio response shape)
 *  - Gay Porn / adult content streams work via the same infoHash mechanism
 */

const byteSize = require('byte-size');
const { parseId } = require('./tools');

const streamHandler = async args => {
    try {
        const { seeders, parsedName, size, index, infoHash } = parseId(args);
        const { value, unit } = byteSize(size);

        const stream = {
            name: 'TPB',
            title: `${parsedName}\n💾  ${value} ${unit}\n👤  ${seeders} seeders`,
            type: args.type,
            infoHash,
            // Only include fileIdx when we know the specific file index.
            // index=false means it's a single-file torrent (movie).
            ...(index !== false && index !== undefined ? { fileIdx: index } : {}),
        };

        return { streams: [stream] };
    } catch (err) {
        console.error(`[stream-handler] Error building stream for ${args.id}: ${err.message}`);
        return { streams: [] };
    }
};

module.exports = streamHandler;
