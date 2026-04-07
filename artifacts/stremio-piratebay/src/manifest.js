/**
 * Stremio Addon Manifest
 *
 * Changes from originals:
 *  - Added Gay Porn / adult-specific catalog entries for both movie and series types
 *  - Expanded genre lists to include all adult sub-categories
 *  - Updated ID prefixes and descriptions
 *  - Added 'search' extra to every catalog for free-text search
 */
module.exports = {
    id: 'org.stremio.thepiratebay-catalog.v2',
    version: '2.0.0',
    name: 'ThePirateBay Catalog',
    description:
        'Browse, search and stream torrents from The Pirate Bay. Includes adult/gay content categories.',
    isFree: true,
    resources: ['catalog', 'stream', 'meta'],
    logo: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/02b4826d-e6a0-4129-8486-38b601edaa03/dcs8pfz-9e7d00ac-d2f7-4ff2-88cb-8466d383a96a.png',
    background:
        'https://www.wallpapertip.com/wmimgs/181-1815770_the-pirate-bay-the-pirate-bay-tracker-torrent.jpg',
    types: ['movie', 'series', 'other'],
    contactEmail: 'thanosdi@live.com',
    catalogs: [
        // ── Regular movie catalog (with genre filter) ──────────────────────────
        {
            type: 'movie',
            id: 'tpbctlg-movies',
            name: 'TPB Movies',
            extra: [
                {
                    name: 'genre',
                    options: [
                        'Movies',
                        'Movies DVDR',
                        'Music videos',
                        'Movie clips',
                        'HD - Movies',
                        '3D',
                    ],
                    isRequired: false,
                },
                { name: 'search', isRequired: false },
            ],
        },
        // ── Regular TV / series catalog ────────────────────────────────────────
        {
            type: 'series',
            id: 'tpbctlg-series',
            name: 'TPB TV Shows',
            extra: [
                {
                    name: 'genre',
                    options: ['TV shows', 'HD - TV shows'],
                    isRequired: false,
                },
                { name: 'search', isRequired: false },
            ],
        },
        // ── Adult / Porn catalog (movies) ──────────────────────────────────────
        {
            type: 'movie',
            id: 'tpbctlg-porn-movies',
            name: 'TPB Adult – Movies',
            extra: [
                {
                    name: 'genre',
                    options: [
                        'Porn',
                        'Porn HD',
                        'Porn Movies',
                        'Porn Movie clips',
                        'Porn HD clips',
                        'Porn DVD',
                        'Gay Porn',
                        'Porn recent',
                    ],
                    isRequired: false,
                },
                { name: 'search', isRequired: false },
            ],
        },
        // ── Adult / Porn catalog (series/episodes) ─────────────────────────────
        {
            type: 'series',
            id: 'tpbctlg-porn-series',
            name: 'TPB Adult – Series',
            extra: [
                {
                    name: 'genre',
                    options: [
                        'Porn',
                        'Porn HD',
                        'Gay Porn',
                        'Porn recent',
                    ],
                    isRequired: false,
                },
                { name: 'search', isRequired: false },
            ],
        },
        // ── Free-text search catalogs (required search extra) ──────────────────
        {
            type: 'movie',
            id: 'Movies',
            name: 'TPB Search Movies',
            extra: [{ name: 'search', isRequired: true }],
        },
        {
            type: 'series',
            id: 'TV shows',
            name: 'TPB Search TV',
            extra: [{ name: 'search', isRequired: true }],
        },
        {
            type: 'movie',
            id: 'Porn',
            name: 'TPB Search Adult',
            extra: [{ name: 'search', isRequired: true }],
        },
        {
            type: 'movie',
            id: 'Gay Porn',
            name: 'TPB Search Gay Porn',
            extra: [{ name: 'search', isRequired: true }],
        },
    ],
    idPrefixes: ['tpb-ctl'],
    idProperty: ['imdb_id'],
    behaviorHints: {
        adult: true,
    },
};
