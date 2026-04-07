/**
 * Meta Handler
 *
 * Handles the /meta/ endpoint: given an encoded item ID it resolves
 * the torrent file list and maps them to Stremio video episodes/entries.
 *
 * Fixes vs. original:
 *  - `url-exist` v2 changed API and is unreliable; replaced with a lightweight
 *    HEAD request via `got` with a 5-second timeout
 *  - `propEq` Ramda v0.29 argument order fixed
 *  - `anyPass([propEq('season', 0)])` – propEq now takes (value, key) in R0.29;
 *    switched to explicit predicate functions for clarity
 *  - `magnet2torrent-js` can time out; wrapped in a try/catch so meta still
 *    returns something useful even if torrent metadata fetch fails
 *  - Gay Porn content (id === 'Gay Porn') treated same as Porn for video listing
 */

const {
    ifElse,
    filter,
    pipe,
    map,
    pathOr,
    propOr,
    addIndex,
} = require('ramda');

const { encode } = require('base-64');
const Magnet2torrent = require('magnet2torrent-js');
const episodeParser = require('episode-parser');
const isVideo = require('is-video');
const got = require('got');

const { parseId, getId } = require('./tools');

const mapIndexed = addIndex(map);

const m2t = new Magnet2torrent({ timeout: 120 });

const FALLBACK_LOGO =
    'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/02b4826d-e6a0-4129-8486-38b601edaa03/dcs8pfz-9e7d00ac-d2f7-4ff2-88cb-8466d383a96a.png';
const FALLBACK_BACKGROUND =
    'https://www.wallpapertip.com/wmimgs/181-1815770_the-pirate-bay-the-pirate-bay-tracker-torrent.jpg';

/**
 * Quick HTTP HEAD check to see if a URL actually resolves.
 * Returns false on any error / non-200 response.
 */
const urlExists = async url => {
    try {
        const resp = await got.head(url, { timeout: { request: 5000 }, throwHttpErrors: false });
        return resp.statusCode >= 200 && resp.statusCode < 400;
    } catch (_) {
        return false;
    }
};

/**
 * Determine whether to show the search/episode-picker view.
 * True for items without real season data or adult content catalogs.
 */
const shouldShowSearch = ({ season, extra }) =>
    season === 0 ||
    (extra && (extra.id === 'Porn' || extra.id === 'Gay Porn' || extra.id === 'tpbctlg-porn-series' || extra.id === 'tpbctlg-porn-movies'));

/**
 * Given a resolved torrent object, build the array of Stremio video entries.
 * For series/adult content we list individual files; for movies we return [].
 */
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

            // firstAired hack: empty string → Stremio shows the search/list view;
            // a real date → Stremio shows the standard episode view.
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

module.exports = metaHandler;
