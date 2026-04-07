import parseTorrentTitle from 'parse-torrent-title';

export function escapeTitle(title, hyphenEscape = true) {
    return title.toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036F]/g, '')
        .replace(/&/g, 'and')
        .replace(hyphenEscape ? /[.,_+ -]+/g : /[.,_+ ]+/g, ' ')
        .replace(/[^\w- ()]/gi, '')
        .trim();
}

export function mostCommonTitle(torrents) {
    if (!torrents.length) return null;
    return torrents
        .map(t => parseTorrentTitle.parse(t.name))
        .map(p => escapeTitle(p.title || ''))
        .filter(Boolean)
        .reduce((a, b, _i, arr) =>
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b,
            null
        );
}

export function canContainEpisode(torrent, seriesInfo, seasonInfoOnly = false) {
    if (seriesInfo.title.length > 50) {
        return seriesInfo.title.includes(escapeTitle(torrent.name));
    }
    const titleRegex = new RegExp(`(?:^|\\()${seriesInfo.title}`, 'i');
    const titleInfo = parseTorrentTitle.parse(torrent.name);
    const matchesTitle = seasonInfoOnly || titleRegex.test(escapeTitle(titleInfo.title || ''));
    const matchesSeason =
        (titleInfo.seasons && titleInfo.seasons.includes(seriesInfo.season)) ||
        (!titleInfo.seasons && !!titleInfo.episodes);
    const matchesEpisode =
        !titleInfo.episodes ||
        titleInfo.episodes.includes(seriesInfo.episode) ||
        titleInfo.episodes.includes(seriesInfo.absoluteEpisode);
    const isComplete = titleInfo.complete || (!titleInfo.seasons && !titleInfo.episodes);

    return matchesTitle && (matchesEpisode && matchesSeason || isComplete);
}

export function containSingleEpisode(torrent, seriesInfo) {
    const info = parseTorrentTitle.parse(torrent.name);
    return info.season === seriesInfo.season && info.episode === seriesInfo.episode;
}

export function onlyPossibleEpisodes(files, season, episode, absoluteEpisode) {
    const eReg = (`@${episode}`).slice(-2).replace(/@/g, '0?');
    const absReg = (`@@${absoluteEpisode}`).slice(-3).replace(/@/g, '0?');
    const seReg = `${season * 100 + episode}`;
    const fullRegex = new RegExp(`(?:\\D|^)(${eReg}|${absReg}|${seReg})\\D`);
    return files.filter(f => fullRegex.test(f.name));
}

export function isCorrectEpisode(torrent, file, seriesInfo) {
    const info = parseTorrentTitle.parse(file.name);
    const { season, episodes } = info;
    if (!episodes) return false;

    if (season === seriesInfo.season && episodes.includes(seriesInfo.episode)) {
        file.season = season;
        file.episode = seriesInfo.episode;
        return true;
    }
    if (episodes.includes(seriesInfo.absoluteEpisode)) {
        file.episode = seriesInfo.absoluteEpisode;
        return true;
    }
    const combined = seriesInfo.season * 100 + seriesInfo.episode;
    if (seriesInfo.episode < 100 && seriesInfo.season > 0 && episodes.includes(combined)) {
        file.season = season;
        file.episode = combined;
        return true;
    }
    return false;
}

export function filterMovieTitles(torrents, movieInfo) {
    const regex = new RegExp(`\\b${movieInfo.title}\\b.*\\b${movieInfo.year}\\b`);
    return torrents.filter(t => regex.test(escapeTitle(t.name)));
}
