/**
 * TPB+ — get files from a torrent.
 * Uses TPB's f.php API first. No torrent-stream fallback (requires native bindings).
 */

import isVideo from 'is-video';
import { files as tpbFiles } from './tpb-api.js';

const _cache = new Map();

export async function torrentFiles(torrent) {
    if (_cache.has(torrent.infoHash)) return _cache.get(torrent.infoHash);

    let result = [];
    if (torrent.id) {
        const apiFiles = await tpbFiles(torrent.id).catch(() => []);
        if (apiFiles.length) {
            result = apiFiles
                .map((f, idx) => ({
                    name: f.path.replace(/^.+\//, ''),
                    path: f.path,
                    index: idx,
                    size: f.size,
                }))
                .filter(f => isVideo(f.name));
        }
    }

    _cache.set(torrent.infoHash, result);
    return result;
}
