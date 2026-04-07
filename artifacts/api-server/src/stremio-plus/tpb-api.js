/**
 * TPB+ — apibay.org API client
 * Replaces deprecated `request`/`axios` with `got`.
 */

import got from 'got';

const BASE_URL = 'https://apibay.org';
const TIMEOUT_MS = 7000;

async function _request(endpoint, retries = 2) {
    const url = `${BASE_URL}/${endpoint}`;
    try {
        const body = await got(url, { timeout: { request: TIMEOUT_MS } }).json();
        if (!Array.isArray(body) || (body.length === 1 && body[0].name === 'No results returned.')) {
            return [];
        }
        return body;
    } catch (err) {
        if (retries > 0) return _request(endpoint, retries - 1);
        console.error(`[tpb-api] request failed: ${url} — ${err.message}`);
        return [];
    }
}

function toTorrent(result) {
    return {
        id: result.id,
        name: result.name,
        size: Number(result.size) || 0,
        seeders: Number(result.seeders) || 0,
        leechers: Number(result.leechers) || 0,
        infoHash: (result.info_hash || '').toLowerCase(),
    };
}

export async function search(keyword, cat = 200) {
    if (!keyword) return [];
    const q = encodeURIComponent(keyword.substring(0, 60));
    const results = await _request(`q.php?q=${q}&cat=${cat}`);
    return results
        .map(toTorrent)
        .filter(t => t.infoHash && t.infoHash !== '0000000000000000000000000000000000000000');
}

export async function files(torrentId) {
    if (!torrentId) return [];
    const results = await _request(`f.php?id=${torrentId}`);
    if (!results.length || !results[0].name) return [];
    if (results[0].name[0] === 'Filelist not found') return [];
    return results.map(f => ({
        path: f.name[0],
        size: Number(f.size[0]) || 0,
    }));
}
