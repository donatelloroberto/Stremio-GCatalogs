/**
 * TPB+ — metadata lookup via Cinemeta
 * Replaces `axios` with `got`.
 */

import got from 'got';
import { escapeTitle } from './filter.js';

const CINEMETA_URL = process.env.CINEMETA_URL || 'https://v3-cinemeta.strem.io';
const TIMEOUT_MS = 5000;

const _cache = new Map();

async function _getMetadataCinemeta(imdbId, type) {
    const url = `${CINEMETA_URL}/meta/${type}/${imdbId}.json`;
    try {
        const data = await got(url, { timeout: { request: TIMEOUT_MS } }).json();
        if (data && data.meta && data.meta.name) {
            const episodeCount = data.meta.videos
                ? Object.entries(
                    data.meta.videos.reduce((acc, v) => {
                        if (v.season && v.season > 0) {
                            acc[v.season] = (acc[v.season] || 0) + 1;
                        }
                        return acc;
                    }, {})
                )
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([, count]) => count)
                : undefined;
            return {
                title: escapeTitle(data.meta.name),
                year: data.meta.year,
                episodeCount,
            };
        }
    } catch (err) {
        console.error(`[metadata] cinemeta failed ${imdbId}: ${err.message}`);
    }
    throw new Error(`cinemeta failed for ${imdbId}`);
}

export async function getMetadata(imdbId, type) {
    if (_cache.has(imdbId)) return _cache.get(imdbId);
    const meta = await _getMetadataCinemeta(imdbId, type);
    _cache.set(imdbId, meta);
    return meta;
}

export async function seriesMetadata(args) {
    const [imdbId, seasonStr, episodeStr] = args.id.split(':');
    const season = parseInt(seasonStr, 10);
    const episode = parseInt(episodeStr, 10);
    const padS = season < 10 ? `0${season}` : `${season}`;
    const padE = episode < 10 ? `0${episode}` : `${episode}`;

    const metadata = await getMetadata(imdbId, args.type);
    const hasEpisodeCount = metadata.episodeCount && metadata.episodeCount.length >= season;

    return {
        imdb: imdbId,
        title: metadata.title,
        episodeTitle: `${metadata.title} s${padS}e${padE}`,
        season,
        episode,
        absoluteEpisode: hasEpisodeCount
            ? metadata.episodeCount.slice(0, season - 1).reduce((a, b) => a + b, episode)
            : episode,
        totalEpisodes: hasEpisodeCount
            ? metadata.episodeCount.reduce((a, b) => a + b, 0)
            : 0,
        episodesInSeason: hasEpisodeCount ? metadata.episodeCount[season - 1] : 0,
    };
}

export async function movieMetadata(args) {
    const metadata = await getMetadata(args.id, args.type);
    return { title: metadata.title, year: metadata.year };
}
