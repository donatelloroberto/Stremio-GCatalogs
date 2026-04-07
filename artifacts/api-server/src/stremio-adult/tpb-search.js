/**
 * TPB search by title for adult catalog streams
 */
import got from 'got';

const APIBAY = 'https://apibay.org/q.php';

const UA = 'Mozilla/5.0 (compatible; Stremio; stremio-thepiratebay)';

function formatSize(bytes) {
    const n = Number(bytes);
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)} MB`;
    return `${n} B`;
}

function quality(name) {
    if (/4k|2160p/i.test(name)) return '4K';
    if (/1080p/i.test(name)) return '1080p';
    if (/720p/i.test(name)) return '720p';
    if (/480p/i.test(name)) return '480p';
    return 'HD';
}

export async function streamsByTitle(title) {
    if (!title) return [];

    const q = encodeURIComponent(title);
    // cat=500 = adult, cat=0 = all
    const urls = [
        `${APIBAY}?q=${q}&cat=500`,
        `${APIBAY}?q=${q}&cat=0`,
    ];

    let torrents = [];
    for (const url of urls) {
        try {
            const body = await got(url, {
                headers: { 'User-Agent': UA },
                timeout: { request: 10000 },
            }).json();

            if (Array.isArray(body) && body.length && body[0].id !== '0') {
                torrents = body.filter(t => t.seeders > 0);
                if (torrents.length > 0) break;
            }
        } catch {}
    }

    torrents.sort((a, b) => Number(b.seeders) - Number(a.seeders));

    return torrents.slice(0, 5).map(t => {
        const q = quality(t.name);
        const size = formatSize(t.size);
        return {
            name: `TPB · ${q}`,
            description: `${t.name}\n👥 ${t.seeders} seeders · ${size}`,
            infoHash: t.info_hash.toLowerCase(),
            fileIdx: undefined,
            behaviorHints: { bingeGroup: `tpb-${t.info_hash.toLowerCase()}` },
        };
    });
}
