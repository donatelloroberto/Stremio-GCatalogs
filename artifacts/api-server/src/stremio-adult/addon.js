/**
 * Adult Sites Catalog Addon
 *
 * Provides catalog browsing and search for:
 *  - IAFD (Internet Adult Film Database) — search only
 *  - WayBig (gay adult content blog) — browse + search
 *  - gay-movie.org (gay adult film blog) — browse + search
 *
 * Streams come from TPB search by title.
 */
import { searchIAFD, getIAFDMeta } from './scrapers/iafd.js';
import { browseWayBig, searchWayBig, getWayBigMeta } from './scrapers/waybig.js';
import { browseGayMovie, searchGayMovie, getGayMovieMeta } from './scrapers/gaymovie.js';
import { streamsByTitle } from './tpb-search.js';

const CACHE = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function cached(key, fn) {
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.val);
    return fn().then(val => {
        CACHE.set(key, { val, ts: Date.now() });
        return val;
    });
}

function decodeId(id) {
    // id format: adult:{site}:{base64url(url)}
    const parts = id.split(':');
    if (parts.length < 3 || parts[0] !== 'adult') return null;
    const site = parts[1];
    const encoded = parts.slice(2).join(':');
    try {
        const url = Buffer.from(encoded, 'base64url').toString('utf-8');
        return { site, url };
    } catch {
        return null;
    }
}

// -------- catalog handler --------

async function handleCatalog({ type, id, extra }) {
    if (type !== 'movie') return { metas: [] };

    const search = extra?.search;
    const skip = Number(extra?.skip) || 0;
    const page = Math.floor(skip / 20);

    let metas = [];

    try {
        if (id === 'adult-iafd-search') {
            if (!search) return { metas: [] };
            metas = await cached(`iafd:${search}`, () => searchIAFD(search));
        } else if (id === 'adult-waybig-latest') {
            if (search) {
                metas = await cached(`waybig:search:${search}`, () => searchWayBig(search));
            } else {
                metas = await cached(`waybig:page:${page}`, () => browseWayBig(page));
            }
        } else if (id === 'adult-gaymovie') {
            if (search) {
                metas = await cached(`gaymovie:search:${search}`, () => searchGayMovie(search));
            } else {
                metas = await cached(`gaymovie:page:${page}`, () => browseGayMovie(page));
            }
        }
    } catch (err) {
        console.error(`[adult] catalog error ${id}: ${err.message}`);
    }

    return { metas };
}

// -------- meta handler --------

async function handleMeta({ type, id }) {
    if (type !== 'movie') return { meta: null };

    const parsed = decodeId(id);
    if (!parsed) return { meta: null };

    const { site, url } = parsed;
    try {
        let detail = {};
        if (site === 'iafd') detail = await cached(`meta:${id}`, () => getIAFDMeta(url));
        else if (site === 'waybig') detail = await cached(`meta:${id}`, () => getWayBigMeta(url));
        else if (site === 'gaymovie') detail = await cached(`meta:${id}`, () => getGayMovieMeta(url));

        return {
            meta: {
                id,
                type: 'movie',
                name: detail.title || 'Unknown',
                poster: detail.poster,
                background: detail.poster,
                description: detail.description,
                releaseInfo: detail.year || detail.releaseInfo,
                cast: detail.cast,
                genres: detail.genres,
                links: detail.links,
                behaviorHints: { defaultVideoId: id },
            },
        };
    } catch (err) {
        console.error(`[adult] meta error ${id}: ${err.message}`);
        return { meta: null };
    }
}

// -------- stream handler --------

async function handleStream({ type, id }) {
    if (type !== 'movie') return { streams: [] };

    const parsed = decodeId(id);
    if (!parsed) return { streams: [] };

    try {
        const metaKey = `meta:${id}`;
        const cached_meta = CACHE.get(metaKey)?.val;
        let title = cached_meta?.title;

        if (!title) {
            // Decode title from URL path as fallback
            const { url } = parsed;
            const slug = decodeURIComponent(url.split('/').filter(Boolean).pop() || '')
                .replace(/[-_]/g, ' ')
                .replace(/\.\w+$/, '')
                .trim();
            title = slug || 'adult film';
        }

        const streams = await streamsByTitle(title);
        return { streams, cacheMaxAge: 4 * 3600, staleRevalidate: 14400, staleError: 604800 };
    } catch (err) {
        console.error(`[adult] stream error ${id}: ${err.message}`);
        return { streams: [] };
    }
}

// -------- addon builder --------

export function buildAddonInterface(addonBuilder) {
    const manifest = {
        id: 'com.stremio.adult-sites-catalog',
        version: '1.1.0',
        name: 'Adult Sites Catalog',
        description: 'Browse and search IAFD, WayBig, and gay-movie.org directly in Stremio. Streams provided by ThePirateBay.',
        catalogs: [
            {
                type: 'movie',
                id: 'adult-iafd-search',
                name: 'IAFD Search',
                extra: [
                    { name: 'search', isRequired: true },
                ],
            },
            {
                type: 'movie',
                id: 'adult-waybig-latest',
                name: 'WayBig',
                extra: [
                    { name: 'search', isRequired: false },
                    { name: 'skip', isRequired: false },
                ],
            },
            {
                type: 'movie',
                id: 'adult-gaymovie',
                name: 'Gay Movie',
                extra: [
                    { name: 'search', isRequired: false },
                    { name: 'skip', isRequired: false },
                ],
            },
        ],
        resources: ['catalog', 'meta', 'stream'],
        types: ['movie'],
        idPrefixes: ['adult:'],
        background: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
        logo: 'https://www.waybig.com/blog/wp-content/uploads/2018/10/waybig-logo.png',
        behaviorHints: { adult: true, p2p: true },
    };

    const builder = new addonBuilder(manifest);

    builder.defineCatalogHandler(args => handleCatalog(args).catch(e => {
        console.error('[adult] catalog unhandled', e.message);
        return { metas: [] };
    }));

    builder.defineMetaHandler(args => handleMeta(args).catch(e => {
        console.error('[adult] meta unhandled', e.message);
        return { meta: null };
    }));

    builder.defineStreamHandler(args => handleStream(args).catch(e => {
        console.error('[adult] stream unhandled', e.message);
        return { streams: [] };
    }));

    return builder.getInterface();
}
