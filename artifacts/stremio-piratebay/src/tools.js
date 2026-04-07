/**
 * Shared ID encode/decode utilities.
 *
 * Stremio item IDs for this addon have the shape:
 *   tpb-ctl:<base64(JSON)>
 *
 * The JSON payload carries all the info needed to create a stream/meta
 * without a database lookup.
 */

const { pipe, prop, split, last, head } = require('ramda');
const { decode, encode } = require('base-64');

/**
 * Parse a full Stremio ID string and return the embedded JSON object.
 * Handles both "tpb-ctl:<b64>" and "tpb-ctl:<b64>:season:episode:<b64>" formats.
 */
const parseId = args => {
    const id = prop('id', args);
    const parts = split(':', id);

    // For stream/meta IDs the payload is always the last segment after the prefix.
    // Episode IDs have the form: <prefix>:<season>:<episode>:<payload>
    // Catalog IDs have the form:  <prefix>:<payload>
    const payload = last(parts);

    try {
        return JSON.parse(decode(payload));
    } catch (e) {
        throw new Error(`[tools] Failed to parse ID payload: ${payload} — ${e.message}`);
    }
};

/**
 * Extract just the prefix (first segment) from a Stremio ID.
 * e.g. "tpb-ctl:..." → "tpb-ctl"
 */
const getId = pipe(prop('id'), split(':'), head);

/**
 * Build a base64-encoded Stremio ID from a parameters object.
 */
const buildId = (prefix, params) => `${prefix}:${encode(JSON.stringify(params))}`;

module.exports = { parseId, getId, buildId };
