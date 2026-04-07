import {
    filter,
    pipe,
    map,
    pathOr,
    propOr,
    addIndex,
} from 'ramda';

import { encode } from 'base-64';
import Magnet2torrent from 'magnet2torrent-js';
import episodeParser from 'episode-parser';
import isVideo from 'is-video';
import got from 'got';

import { parseId, getId } from './tools.js';

const mapIndexed = addIndex(map);

const m2t = new Magnet2torrent({ timeout: 120 });

const FALLBACK_LOGO =
    'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/02b4826d-e6a0-4129-8486-38b601edaa03/dcs8pfz-9e7d00ac-d2f7-4ff2-88cb-8466d383a96a.png';
const FALLBACK_BACKGROUND =
    'https://www.wallpapertip.com/wmimgs/181-1815770_the-pirate-bay-the-pirate-bay-tracker-torrent.jpg';

const urlExists = async url => {
    try {
        const resp = await got.head(url, { timeout: { request: 5000 }, throwHttpErrors: false });
        return resp.statusCode >= 200 && resp.statusCode < 400;
    } catch (_) {
        return false;
    }
};

const shouldShowSearch = ({ season, extra }) =>
    season === 0 ||
    (extra && (extra.id === 'Porn' || extra.id === 'Gay Porn' || extra.id === 'tpbctlg-porn-series' || extra.id === 'tpbctlg-porn-movies'));

const getVideoArray = ({ args, torrent, magnetLink, seeders, parsedName, size, poster, extra, infoHash }) => {
    const isSeries = pathOr('', ['type'], args) === 'series';
    const isPorn =
        extra &&
        (extra.id === 'Porn' ||
            extra.id === 'Gay Porn' ||
            extra.id === 'tpbctlg-porn-series' ||
            extra.id === 'tpbctlg-porn-movies');

    if (!isSeries && !isPorn) return [];

    const files = pathOr([], ['files'], torrent);

    return pipe(
        mapIndexed((file, index) => ({ ...file, index })),
        filter(({ name }) => isVideo(name)),
        map(file => {
            const episodeParsed = episodeParser(file.name) || {};
            const season = propOr(0, 'season', episodeParsed);
            const episode = propOr(file.index, 'episode', episodeParsed);

            const parameters = {
                magnetLink,
                parsedName: parsedName.trim(),
                size,
                seeders,
                index: file.index,
                extra,
                infoHash,
            };

            const firstAired = shouldShowSearch({ season, extra })
                ? ''
                : '2002-01-31T22:00:00.000Z';

            return {
                name: file.name,
                season,
                number: episode,
                firstAired,
                id: `${getId(args)}:${season}:${episode}:${encode(JSON.stringify(parameters))}`,
                episode,
            };
        }),
    )(files);
};

const metaHandler = async args => {
    const parsed = parseId(args);
    const { magnetLink, seeders, parsedName, size, poster, extra, infoHash } = parsed;

    let torrent = { files: [] };
    try {
        torrent = await m2t.getTorrent(magnetLink);
    } catch (err) {
        console.error(`[meta-handler] Could not resolve torrent for ${infoHash}: ${err.message}`);
    }

    const videos = getVideoArray({
        args,
        torrent,
        magnetLink,
        seeders,
        parsedName,
        size,
        poster,
        extra,
        infoHash,
    });

    const logoUrl = (poster || '').replace('/poster/', '/logo/');
    const backgroundUrl = (poster || '').replace('/poster/', '/background/');

    const [logo, background] = await Promise.all([
        urlExists(logoUrl),
        urlExists(backgroundUrl),
    ]);

    const metaObject = {
        id: args.id,
        name: parsedName,
        background: background ? backgroundUrl : FALLBACK_BACKGROUND,
        logo: logo ? logoUrl : FALLBACK_LOGO,
        posterShape: 'regular',
        type: args.type,
        videos,
        description: parsedName.toUpperCase(),
    };

    return { meta: metaObject };
};

export default metaHandler;
