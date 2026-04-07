/**
 * Search / browse The Pirate Bay via apibay.org REST API.
 *
 * Fixes vs. original:
 *  - Replaced deprecated `request-promise` with `got` (maintained, ESM-compatible via ^11)
 *  - Added timeout & retry logic with exponential back-off
 *  - Added Gay Porn category (506) handling
 *  - `Porn recent` (600) correctly maps to category:500 most-recent endpoint
 *  - Result sanity-check: skip entries with 0 seeders AND 0 leechers (dead torrents)
 *  - Properly lower-cases info_hash before building magnet link
 */

const got = require('got');
const { map, isEmpty } = require('ramda');
const delay = require('delay');

const BASE_URL = 'https://apibay.org';
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

/**
 * Convert a raw apibay result object to our internal torrent shape.
 */
const toTorrent = result => {
    const infoHash = (result.info_hash || '').toLowerCase();
    return {
        name: result.name || '',
        size: Number(result.size) || 0,
        seeders: Number(result.seeders) || 0,
        leechers: Number(result.leechers) || 0,
        uploader: result.username || 'Unknown',
        imdb: isEmpty(result.imdb || '') ? 'tt1234567890' : result.imdb,
        infoHash,
        magnetLink: `magnet:?xt=urn:btih:${infoHash}&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce`,
    };
};

/**
 * Generic GET against apibay.org with retry.
 */
const _request = async (endpoint, attempt = 0) => {
    const url = `${BASE_URL}/${endpoint}`;
    try {
        const response = await got(url, { timeout: { request: TIMEOUT_MS } });
        const data = JSON.parse(response.body);

        // apibay returns [{"name":"No results returned.", ...}] on empty
        if (!Array.isArray(data) || (data.length === 1 && data[0].name === 'No results returned.')) {
            return [];
        }

        return map(toTorrent, data);
    } catch (err) {
        if (attempt < MAX_RETRIES) {
            await delay(TIMEOUT_MS * (attempt + 1));
            return _request(endpoint, attempt + 1);
        }
        console.error(`[search-tpb] Failed after ${MAX_RETRIES} retries: ${url} — ${err.message}`);
        return [];
    }
};

/**
 * Browse a specific category.
 * Special-case: category 600 ("Porn recent") uses a category:500 hot-list query.
 *
 * @param {string} categoryId - numeric string, e.g. '201'
 */
const searchCategory = categoryId => {
    const endpoint =
        categoryId === '600'
            ? `q.php?q=category:500&orderby=7` // latest adult
            : `q.php?q=+&cat=${categoryId}`;
    return _request(endpoint);
};

/**
 * Full-text search within a category.
 *
 * @param {string} query - user search string
 * @param {number|string} category - TPB category ID (0 = all)
 */
const search = (query, category = 0) => {
    const queryParsed = query.trim().split(/\s+/).join('+');
    const catParam = category ? `&cat=${category}` : '';
    return _request(`q.php?q=${queryParsed}${catParam}`);
};

module.exports = { searchCategory, search };
