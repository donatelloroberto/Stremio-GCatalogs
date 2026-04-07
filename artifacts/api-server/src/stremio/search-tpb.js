import got from 'got';
import { map, isEmpty } from 'ramda';
import delay from 'delay';

const BASE_URL = 'https://apibay.org';
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

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

const _request = async (endpoint, attempt = 0) => {
    const url = `${BASE_URL}/${endpoint}`;
    try {
        const response = await got(url, { timeout: { request: TIMEOUT_MS } });
        const data = JSON.parse(response.body);
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

export const searchCategory = categoryId => {
    const endpoint =
        categoryId === '600'
            ? `q.php?q=category:500&orderby=7`
            : `q.php?q=+&cat=${categoryId}`;
    return _request(endpoint);
};

export const search = (query, category = 0) => {
    const queryParsed = query.trim().split(/\s+/).join('+');
    const catParam = category ? `&cat=${category}` : '';
    return _request(`q.php?q=${queryParsed}${catParam}`);
};
