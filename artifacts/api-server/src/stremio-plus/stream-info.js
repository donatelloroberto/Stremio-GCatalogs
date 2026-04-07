import parseTorrentTitle from 'parse-torrent-title';

const SHORT_NAME = 'TPB+';

function formatSize(size) {
    if (!size) return undefined;
    const i = Math.floor(Math.log(Math.max(1, size)) / Math.log(1024));
    return `${Number((size / Math.pow(1024, i)).toFixed(2))} ${'BKMGT'[i] || '?'}B`;
}

function joinParts(parts, prefix = '', sep = ' ') {
    const joined = parts.filter(Boolean).join(sep);
    return joined ? `${prefix}${joined}` : null;
}

export function movieStream(torrent) {
    const info = parseTorrentTitle.parse(torrent.name);
    const title = joinParts([
        joinParts([torrent.name.replace(/[, ]+/g, ' ')]),
        joinParts([info.resolution, info.source], '📺 '),
        joinParts([
            joinParts([torrent.seeders], '👤 '),
            joinParts([formatSize(torrent.size)], '💾 '),
        ]),
    ], '', '\n');

    return {
        name: SHORT_NAME,
        title,
        infoHash: torrent.infoHash,
        tag: info.resolution,
    };
}

export function seriesStream(torrent, episode) {
    const tInfo = parseTorrentTitle.parse(torrent.name);
    const eInfo = parseTorrentTitle.parse(episode.name);
    const sameInfo = tInfo.season === eInfo.season && tInfo.episode && eInfo.episode === tInfo.episode;
    const resolution = tInfo.resolution || eInfo.resolution;
    const quality = tInfo.source || eInfo.source;

    const title = joinParts([
        joinParts([torrent.name.replace(/[, ]+/g, ' ')]),
        joinParts([!sameInfo && episode.name.replace(/[, ]+/g, ' ')]),
        joinParts([resolution, quality], '📺 '),
        joinParts([
            joinParts([torrent.seeders], '👤 '),
            joinParts([formatSize(episode.size)], '💾 '),
        ]),
    ], '', '\n');

    return {
        name: SHORT_NAME,
        title,
        infoHash: torrent.infoHash,
        fileIdx: episode.index,
        tag: resolution,
        behaviorHints: {
            bingeGroup: sameInfo
                ? `tpb+|${resolution || quality}|${eInfo.group || ''}`
                : `tpb+|${torrent.infoHash}`,
        },
    };
}
