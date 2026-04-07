import { pipe, prop, split, last, head } from 'ramda';
import { decode, encode } from 'base-64';

export const parseId = args => {
    const id = prop('id', args);
    const parts = split(':', id);
    const payload = last(parts);
    try {
        return JSON.parse(decode(payload));
    } catch (e) {
        throw new Error(`[tools] Failed to parse ID payload: ${payload} — ${e.message}`);
    }
};

export const getId = pipe(prop('id'), split(':'), head);

export const buildId = (prefix, params) => `${prefix}:${encode(JSON.stringify(params))}`;
