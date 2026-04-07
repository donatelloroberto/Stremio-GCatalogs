import byteSize from 'byte-size';
import { parseId } from './tools.js';

const streamHandler = async args => {
    try {
        const { seeders, parsedName, size, index, infoHash } = parseId(args);
        const { value, unit } = byteSize(size);

        const stream = {
            name: 'TPB',
            title: `${parsedName}\n💾  ${value} ${unit}\n👤  ${seeders} seeders`,
            type: args.type,
            infoHash,
            ...(index !== false && index !== undefined ? { fileIdx: index } : {}),
        };

        return { streams: [stream] };
    } catch (err) {
        console.error(`[stream-handler] Error building stream for ${args.id}: ${err.message}`);
        return { streams: [] };
    }
};

export default streamHandler;
