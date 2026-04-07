/**
 * TPB+ Stream Addon
 *
 * IMDB-ID based stream provider:
 * - Searches TPB by IMDB ID and title
 * - Resolves file list from TPB API for series episode matching
 * - Returns rich stream objects with resolution/quality/size info
 *
 * Fixes vs original:
 * - `request` → `got`  (request is deprecated)
 * - `cheerio` HTML scraper → apibay.org JSON API (more reliable)
 * - Full ESM conversion
 * - Removed MongoDB dependency (in-memory cache)
 * - Simplified episode resolver to not require torrent-stream native bindings
 */

import Bottleneck from 'bottleneck';
import uniqBy from 'lodash/uniqBy.js';
import flatten from 'lodash/flatten.js';

import { search } from './tpb-api.js';
import { movieStream, seriesStream } from './stream-info.js';
import { seriesMetadata, movieMetadata } from './metadata.js';
import { torrentFiles } from './torrent-files.js';
import {
    mostCommonTitle,
    filterMovieTitles,
    canContainEpisode,
    onlyPossibleEpisodes,
    containSingleEpisode,
    isCorrectEpisode,
} from './filter.js';

const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE_PLUS, 10) || 60 * 60 * 24; // 24h
const CACHE_MAX_AGE_EMPTY = 4 * 60 * 60; // 4h
const STALE_REVALIDATE_AGE = 4 * 60 * 60; // 4h
const STALE_ERROR_AGE = 7 * 24 * 60 * 60; // 7d

const limiter = new Bottleneck({
    maxConcurrent: parseInt(process.env.LIMIT_MAX_CONCURRENT, 10) || 15,
    highWater: parseInt(process.env.LIMIT_QUEUE_SIZE, 10) || 20,
    strategy: Bottleneck.strategy.OVERFLOW,
});

// ------- helpers -------

function findEpisodes(torrent, seriesInfo) {
    if (containSingleEpisode(torrent, seriesInfo)) {
        torrent.episodes = [{ name: torrent.name, size: torrent.size, index: undefined }];
        return Promise.resolve(torrent);
    }

    const { season, episode, absoluteEpisode } = seriesInfo;
    return torrentFiles(torrent)
        .then(files => {
            let episodes = onlyPossibleEpisodes(files, season, episode, absoluteEpisode)
                .filter(f => isCorrectEpisode(torrent, f, seriesInfo))
                .sort((a, b) => (a.episode || 0) - (b.episode || 0));

            if (episodes.length > 1) {
                const pruned = episodes.filter(f => !/extra|sample/gi.test(f.name));
                if (pruned.length > 0) episodes = pruned;
            }

            torrent.episodes = episodes.length ? episodes : null;
            return torrent;
        })
        .catch(() => {
            torrent.episodes = null;
            return torrent;
        });
}

// ------- handlers -------

async function seriesStreamHandler(args) {
    const seriesInfo = await seriesMetadata(args).catch(() => ({}));

    const results = await Promise.all([
        search(seriesInfo.imdb, 200),
        search(seriesInfo.title, 200),
        search(seriesInfo.episodeTitle),
    ]);

    const allTorrents = uniqBy(flatten(results), 'infoHash')
        .filter(t => t.seeders > 0)
        .filter((t, _i, arr) => canContainEpisode(t, seriesInfo, results[0].includes(t)))
        .sort((a, b) => b.seeders - a.seeders)
        .slice(0, 10);

    const resolved = await Promise.all(allTorrents.map(t => findEpisodes(t, seriesInfo)));

    return resolved
        .filter(t => t.episodes && t.episodes.length)
        .flatMap(t => t.episodes.slice(0, 3).map(ep => seriesStream(t, ep)))
        .filter(s => s.infoHash);
}

async function movieStreamHandler(args) {
    const movieInfo = await movieMetadata(args).catch(() => ({}));

    const results = await Promise.all([
        search(args.id, 200),
        search(movieInfo.title, 200).then(torrents => filterMovieTitles(torrents, movieInfo)),
    ]);

    return uniqBy(flatten(results), 'infoHash')
        .filter(t => t.seeders > 0)
        .sort((a, b) => b.seeders - a.seeders)
        .slice(0, 5)
        .map(t => movieStream(t));
}

// ------- exported interface builder -------

export function buildAddonInterface(addonBuilder) {
    const manifest = {
        id: 'com.stremio.thepiratebay.plus',
        version: '1.5.0',
        name: 'ThePirateBay+',
        description: 'Stream movies and TV shows directly from ThePirateBay. Works alongside any Stremio catalog — just open a title and see TPB streams.',
        catalogs: [],
        resources: ['stream'],
        types: ['movie', 'series'],
        idPrefixes: ['tt'],
        background: 'https://www.wallpapertip.com/wmimgs/181-1815770_the-pirate-bay-the-pirate-bay-tracker-torrent.jpg',
        logo: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/02b4826d-e6a0-4129-8486-38b601edaa03/dcs8pfz-9e7d00ac-d2f7-4ff2-88cb-8466d383a96a.png',
    };

    const builder = new addonBuilder(manifest);

    builder.defineStreamHandler(args => {
        if (!args.id.match(/tt\d+/i)) {
            return Promise.resolve({ streams: [] });
        }

        const handler =
            args.type === 'series'
                ? () => limiter.schedule(() => seriesStreamHandler(args))
                : () => limiter.schedule(() => movieStreamHandler(args));

        return handler()
            .then(streams => ({
                streams,
                cacheMaxAge: streams.length ? CACHE_MAX_AGE : CACHE_MAX_AGE_EMPTY,
                staleRevalidate: STALE_REVALIDATE_AGE,
                staleError: STALE_ERROR_AGE,
            }))
            .catch(err => {
                console.error(`[tpb+] failed ${args.id}: ${err.message}`);
                return { streams: [] };
            });
    });

    return builder.getInterface();
}
