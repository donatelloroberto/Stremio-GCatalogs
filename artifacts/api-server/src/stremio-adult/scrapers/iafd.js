/**
 * IAFD (Internet Adult Film Database) scraper
 * Search: https://www.iafd.com/results.asp?searchtype=comprehensive&searchstring={query}
 * Performer search: https://www.iafd.com/results.asp?searchtype=comprehensive&searchstring={name}&action=&Search=+Go+
 * Title page: https://www.iafd.com/title.rme/{slug}
 */
import got from 'got';
import * as cheerio from 'cheerio';

const BASE = 'https://www.iafd.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';

const REFERER = `${BASE}/title.rme/title=sample/year=2020/sample.htm`;

async function fetchHtml(url) {
    const res = await got(url, {
        headers: { 'User-Agent': UA, 'Referer': REFERER },
        timeout: { request: 15000 },
        followRedirect: true,
    });
    return cheerio.load(res.body);
}

export async function searchIAFD(query) {
    const q = encodeURIComponent(query.slice(0, 72));
    const url = `${BASE}/results.asp?searchtype=comprehensive&searchstring=${q}`;
    const $ = await fetchHtml(url);

    const results = [];

    // Films section
    $('table#tblFtr tr, table.t-grid tbody tr').each((_i, el) => {
        try {
            const $el = $(el);
            const linkEl = $el.find('td:nth-child(1) a').first();
            const title = linkEl.text().trim();
            const href = linkEl.attr('href') || '';
            if (!title || !href) return;

            const fullUrl = href.startsWith('http') ? href : BASE + href;
            const year = $el.find('td:nth-child(2)').text().trim();
            const poster = $el.find('img').first().attr('src') || '';

            const slug = Buffer.from(fullUrl).toString('base64url');
            results.push({
                id: `adult:iafd:${slug}`,
                type: 'movie',
                name: title,
                releaseInfo: year || undefined,
                poster: poster && !poster.includes('nophoto') ? (poster.startsWith('http') ? poster : BASE + poster) : undefined,
                description: `IAFD — ${year}`,
            });
        } catch {}
    });

    // Fallback: look for film links in any table rows
    if (results.length === 0) {
        $('a[href*="/title.rme/"]').each((_i, el) => {
            try {
                const $el = $(el);
                const title = $el.text().trim();
                const href = $el.attr('href') || '';
                if (!title || !href) return;

                const fullUrl = href.startsWith('http') ? href : BASE + href;
                const slug = Buffer.from(fullUrl).toString('base64url');
                results.push({
                    id: `adult:iafd:${slug}`,
                    type: 'movie',
                    name: title,
                    description: 'IAFD',
                });
            } catch {}
        });
    }

    return results.slice(0, 25);
}

export async function getIAFDMeta(url) {
    const $ = await fetchHtml(url);

    const title = $('h1.centerheader').text().trim() || $('h1').first().text().trim();
    const year = $('.bioheading:contains("Year")').next('.biodata').text().trim()
        || $('p.biodata').first().text().match(/\d{4}/)?.[0] || '';

    const poster = $('#headshot img, .posbanner img').first().attr('src') || '';
    const fullPoster = poster && !poster.includes('nophoto')
        ? (poster.startsWith('http') ? poster : BASE + poster)
        : undefined;

    const description = $('p.bioheading:contains("Synopsis")').next('p').text().trim()
        || $('div.bioheading:contains("Synopsis")').next().text().trim() || '';

    const studio = $('p.bioheading:contains("Studio")').next('.biodata').text().trim()
        || $('.bioheading:contains("Studio")').next().text().trim() || '';

    const cast = [];
    $('div.performer a, p.bioheading:contains("Cast")').next().find('a').each((_i, el) => {
        const name = $(el).text().trim();
        if (name) cast.push({ name });
    });

    // Also look for cast in the page's performer links
    $('a[href*="/person.rme/"]').each((_i, el) => {
        const name = $(el).text().trim();
        if (name && !cast.find(c => c.name === name)) cast.push({ name });
    });

    const genres = [];
    $('.bioheading:contains("Genre")').next('.biodata').find('a').each((_i, el) => {
        genres.push($(el).text().trim());
    });

    return {
        title,
        year: year || undefined,
        poster: fullPoster,
        description: description || (studio ? `Studio: ${studio}` : undefined),
        cast: cast.slice(0, 20),
        genres: genres.length ? genres : undefined,
        links: [{ name: 'View on IAFD', category: 'IAFD', url }],
    };
}
