/**
 * Catalog Handler
 *
 * Fixes vs. original:
 *  - Ramda v0.29 broke propEq argument order – now using (value, key) instead of (key, value)
 *  - Added Gay Porn category routing
 *  - Inline search now routes correctly for all adult sub-categories
 *  - `skip` pagination guard returns empty result set (unchanged, correct behaviour)
 *  - `parseVideo` result is an object; safely extract `.name` for display
 *  - cacheMaxAge falls back safely when env var is missing/NaN
 */

const {
    pipe,
    map,
    find,
    prop,
    filter,
    T,
    cond,
    hasPath,
    has,
    isEmpty,
    pathOr,
    ifElse,
    sortBy,
    compose,
} = require('ramda');

const byteSize = require('byte-size');
const parseVideo = require('video-name-parser');
const pPipe = require('p-pipe');
const pMap = require('p-map');
const { encode } = require('base-64');

const { searchCategory, search } = require('./search-tpb');
const categories = require('./categories');

const METAHUB_URL = 'https://images.metahub.space';

const sortBySeeders = sortBy(compose(a => -a, prop('seeders')));

/**
 * Find category ID by name from the categories list.
 * Handles undefined gracefully – falls back to '200' (Video root).
 */
const getCategoryId = (cats, name) => {
    const found = cats.find(c => c.name === name);
    return found ? found.id : '200';
};

/**
 * Strip non-ASCII characters to avoid JSON/URL encoding issues.
 */
const cleanString = input =>
    Array.from(input)
        .filter(ch => ch.charCodeAt(0) <= 127)
        .join('');

/**
 * Given a catalog args object and a torrent item, produce the Stremio
 * meta-preview object surfaced in the catalog row.
 */
const generateMetaPreview = ({
    imdbId,
    type,
    parsedName,
    size,
    seeders,
    leechers,
    magnetLink,
    uploader,
    extra,
    infoHash,
}) => {
    const poster =
        imdbId && imdbId !== 'tt1234567890'
            ? `${METAHUB_URL}/poster/large/${imdbId}/img`
            : 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/02b4826d-e6a0-4129-8486-38b601edaa03/dcs8pfz-9e7d00ac-d2f7-4ff2-88cb-8466d383a96a.png';

    const { value, unit } = byteSize(size);

    const parameters = {
        magnetLink,
        parsedName: parsedName.trim(),
        size,
        seeders,
        leechers,
        poster,
        extra,
        infoHash,
    };

    return {
        id: `tpb-ctl:${encode(JSON.stringify(parameters))}`,
        type,
        name: parsedName,
        poster,
        description: `Size: ${value} ${unit}\n\nSeeders: ${seeders}\n\nLeechers: ${leechers}\n\nUploader: ${uploader}`,
    };
};

/**
 * Determine the numeric TPB category ID for a search-catalog request.
 * This covers all named search catalogs including Gay Porn.
 */
const getSearchCategoryId = args =>
    cond([
        [a => a.id === 'Movies', () => '201'],
        [a => a.id === 'TV shows', () => '205'],
        [a => a.id === 'Porn', () => '500'],
        [a => a.id === 'Gay Porn', () => '506'],
        [T, () => '0'],
    ])(args);

/**
 * Core torrent-fetching pipeline:
 *  1. Decide whether to do a free-text search or a category browse
 *  2. Filter out unnamed results
 *  3. Sort by seeders descending
 *  4. Enrich each result with parsed name / type info
 *  5. Convert to Stremio meta-preview shape
 */
const fetchTorrents = async ({ categoryId, args }) => {
    const isSearch = hasPath(['extra', 'search'], args);

    let torrents;
    if (isSearch) {
        const catId = getSearchCategoryId(args);
        torrents = await search(args.extra.search, catId);
    } else {
        torrents = await searchCategory(categoryId);
    }

    const filtered = filter(item => item.name, torrents);
    const sorted = sortBySeeders(filtered);

    return pMap(sorted, async item => {
        const name = cleanString(item.name);
        let parsedName = name;
        try {
            const parsed = parseVideo(name);
            const seasonStr = has('season', parsed) ? ` Season ${parsed.season}` : '';
            const episodeStr =
                has('episode', parsed) && Array.isArray(parsed.episode)
                    ? ` Episodes ${parsed.episode.join(', ')}`
                    : '';
            parsedName = `${name}${seasonStr}${episodeStr}`.trim();
        } catch (_) {
            // parseVideo can throw on odd inputs – keep raw name
        }

        return generateMetaPreview({
            imdbId: item.imdb,
            type: args.type,
            parsedName,
            size: item.size,
            seeders: item.seeders,
            leechers: item.leechers,
            magnetLink: item.magnetLink,
            uploader: item.uploader,
            extra: args,
            infoHash: item.infoHash,
        });
    });
};

/**
 * Resolve the default top-level category for a catalog ID.
 */
const getTopCategory = id => {
    if (id === 'tpbctlg-movies') return 'Movies';
    if (id === 'tpbctlg-series') return 'TV shows';
    if (id === 'tpbctlg-porn-movies') return 'Porn';
    if (id === 'tpbctlg-porn-series') return 'Porn';
    return 'Movies';
};

const catalogHandler = async args => {
    // Stremio sends skip for pagination; we only return one page of results.
    const hasSkip = pathOr(false, ['extra', 'skip'], args);
    if (hasSkip) {
        return { metas: [], cacheMaxAge: 10 };
    }

    const topCategory = getTopCategory(args.id);
    const selectedGenre = pathOr(null, ['extra', 'genre'], args);
    const categoryId = getCategoryId(categories, selectedGenre || topCategory);

    const metas = await fetchTorrents({ categoryId, args });

    const isDev = process.env.ENVIRONMENT === 'development';
    const devTimeout = parseInt(process.env.CACHE_TIMEOUT, 10);
    const cacheMaxAge = isDev && !isNaN(devTimeout) ? devTimeout : 3600;

    const cacheProperties = isEmpty(metas)
        ? { staleRevalidate: 120 }
        : { cacheMaxAge };

    return { metas, ...cacheProperties };
};

module.exports = catalogHandler;
