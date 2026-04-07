/**
 * IAFD (Internet Adult Film Database) scraper
 * Search: https://www.iafd.com/results.asp?searchtype=comprehensive&searchstring={query}
 * Detail: https://www.iafd.com/title.rme/id={UUID}
 *
 * HTML structure (as observed):
 *   <tr class="co">
 *     <td><a href="https://www.iafd.com/title.rme/id=UUID">Title</a></td>
 *     <td>2024</td>
 *     <td>Studio</td>
 *     ...
 *   </tr>
 */
import got from 'got';
import * as cheerio from 'cheerio';

const BASE = 'https://www.iafd.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';
const REFERER = `${BASE}/`;

async function fetchHtml(url) {
    const res = await got(url, {
        headers: { 'User-Agent': UA, 'Referer': REFERER },
        timeout: { request: 15000 },
        followRedirect: true,
    });
    return { body: res.body, $: cheerio.load(res.body) };
}

export async function searchIAFD(query) {
    const q = encodeURIComponent(query.slice(0, 72));
    const url = `${BASE}/results.asp?searchtype=comprehensive&searchstring=${q}`;
    const { body } = await fetchHtml(url);

    const results = [];

    // The table rows have format:
    // <tr class="co"><td><a href="https://www.iafd.com/title.rme/id=UUID">Title</a></td><td>YEAR</td><td>Studio</td>...
    const rowPattern = /<tr[^>]*class="co[^"]*"[^>]*>\s*<td[^>]*>\s*<a\s+href="(https:\/\/www\.iafd\.com\/title\.rme\/id=[^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>\s*<td[^>]*>(\d{4})?<\/td>\s*<td[^>]*>([^<]*)<\/td>/gi;

    let match;
    while ((match = rowPattern.exec(body)) !== null) {
        const filmUrl = match[1];
        const title = match[2].trim();
        const year = match[3] || '';
        const studio = match[4]?.trim() || '';

        if (!title || !filmUrl) continue;

        const slug = Buffer.from(filmUrl).toString('base64url');
        results.push({
            id: `adult:iafd:${slug}`,
            type: 'movie',
            name: title,
            releaseInfo: year || undefined,
            // IAFD search doesn't have posters in the results table
            // We use a placeholder until the detail page is fetched
            description: studio ? `${studio}${year ? ` (${year})` : ''}` : (year || 'IAFD'),
        });

        if (results.length >= 25) break;
    }

    return results;
}

export async function getIAFDMeta(url) {
    const { $, body } = await fetchHtml(url);

    const title = $('h1.centerheader').first().text().trim()
        || $('h1').first().text().trim()
        || 'Unknown';

    // Poster: IAFD uses a boxshot image for the film
    const posterEl = $('img.boxshot, #headshot img, .posbanner img, img[src*="/graphics/filmimages/"]').first();
    const posterSrc = posterEl.attr('src') || '';
    const fullPoster = posterSrc
        ? (posterSrc.startsWith('http') ? posterSrc : BASE + posterSrc)
        : undefined;

    // If we have a boxshot with nophoto, discard it
    const poster = (fullPoster && !fullPoster.includes('nophoto')) ? fullPoster : undefined;

    // Year
    const year = $('p.bioheading:contains("Year"), .bioheading:contains("Year")').next('.biodata').text().trim()
        || body.match(/Released.*?(\d{4})/)?.[1]
        || $('th:contains("Year")').next('td').text().trim()
        || '';

    // Synopsis
    const description = $('p.biodata:contains("Synopsis")').text().trim()
        || $('p.bioheading:contains("Synopsis"), .bioheading:contains("Synopsis")').next('p, .biodata').text().trim()
        || '';

    const studio = $('p.bioheading:contains("Studio"), .bioheading:contains("Studio")').next('.biodata').text().trim()
        || $('a[href*="/studio.rme/"]').first().text().trim()
        || '';

    const cast = [];
    $('a[href*="/person.rme/"]').each((_i, el) => {
        const name = $(el).text().trim();
        if (name && !cast.find(c => c.name === name)) cast.push({ name });
    });

    const genres = [];
    $('a[href*="/results.asp?searchtype=PerformerType"]').each((_i, el) => {
        genres.push($(el).text().trim());
    });

    return {
        title,
        year: year || undefined,
        poster,
        description: description || (studio ? `Studio: ${studio}` : undefined),
        cast: cast.slice(0, 20),
        genres: genres.length ? genres : undefined,
        links: [{ name: 'View on IAFD', category: 'IAFD', url }],
    };
}
