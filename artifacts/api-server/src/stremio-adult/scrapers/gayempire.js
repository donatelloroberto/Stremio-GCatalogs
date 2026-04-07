/**
 * GayDVDEmpire / AdultDVDEmpire scraper
 * Browse: https://www.gaydvdempire.com/gay/movies/
 * Search: https://www.gaydvdempire.com/AllSearch/Search?view=list&q={query}&page={N}
 */
import got from 'got';
import * as cheerio from 'cheerio';

const BASE = 'https://www.gaydvdempire.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';

async function fetchHtml(url) {
    const res = await got(url, {
        headers: {
            'User-Agent': UA,
            'Cookie': 'ageConfirmed=true; preferences=adult',
        },
        timeout: { request: 15000 },
        followRedirect: true,
    });
    return cheerio.load(res.body);
}

function parseListPage($) {
    const results = [];
    $('.movie-box, .product-card, li.item, div[class*="movie-item"]').each((_i, el) => {
        try {
            const $el = $(el);
            const linkEl = $el.find('a').first();
            const href = linkEl.attr('href') || '';
            if (!href) return;

            const title = $el.find('strong, .title, h3, h4').first().text().trim()
                || linkEl.attr('title') || '';
            if (!title) return;

            const fullUrl = href.startsWith('http') ? href : BASE + href;
            const poster = $el.find('img').first().attr('src')
                || $el.find('img').first().attr('data-src') || '';

            const year = $el.find('.year, [class*="year"]').text().trim();

            const slug = Buffer.from(fullUrl).toString('base64url');
            results.push({
                id: `adult:gde:${slug}`,
                type: 'movie',
                name: title,
                poster: poster || undefined,
                releaseInfo: year || undefined,
                description: `GayDVDEmpire`,
            });
        } catch {}
    });
    return results;
}

export async function browseGayEmpire(page = 0) {
    const pageNum = page + 1;
    const url = `${BASE}/gay/movies/?page=${pageNum}&sort=Newest`;
    const $ = await fetchHtml(url);
    return parseListPage($);
}

export async function searchGayEmpire(query) {
    const q = encodeURIComponent(query);
    const url = `${BASE}/AllSearch/Search?view=list&q=${q}&page=1`;
    const $ = await fetchHtml(url);

    // GDE search has a specific result structure
    const results = [];
    $('.list-view-item, .item-info, .row .col').each((_i, el) => {
        try {
            const $el = $(el);
            const linkEl = $el.find('a[href*="/gay/"]').first();
            const href = linkEl.attr('href') || '';
            if (!href) return;

            const title = $el.find('strong, h2, h3, .title').first().text().trim()
                || linkEl.text().trim();
            if (!title) return;

            const fullUrl = href.startsWith('http') ? href : BASE + href;
            const poster = $el.find('img').first().attr('src') || '';
            const slug = Buffer.from(fullUrl).toString('base64url');

            results.push({
                id: `adult:gde:${slug}`,
                type: 'movie',
                name: title,
                poster: poster || undefined,
                description: 'GayDVDEmpire',
            });
        } catch {}
    });

    // Fallback: generic list
    if (results.length === 0) {
        const $ = await fetchHtml(url);
        return parseListPage($);
    }

    return results.slice(0, 25);
}

export async function getGayEmpireMeta(url) {
    const $ = await fetchHtml(url);

    const title = $('h1, .title-section h1, h1.title').first().text().trim();

    const poster = $('.boxcover img, .front-box img, #dvd-boxcover img').first().attr('src')
        || $('img[class*="cover"], img[class*="boxart"]').first().attr('src') || '';

    const description = $('[itemprop="description"], .synopsis, .description, p.video-synopsis').first().text().trim();

    const year = $('[itemprop="datePublished"], .release-date, .year').first().text().trim().match(/\d{4}/)?.[0] || '';

    const studio = $('[itemprop="brand"], .studio a, a[href*="/studio/"]').first().text().trim();

    const cast = [];
    $('a[href*="/gay/straight/"], a[href*="/performer/"], .performer a, [itemprop="actor"]').each((_i, el) => {
        const name = $(el).text().trim();
        if (name && !cast.find(c => c.name === name)) cast.push({ name });
    });

    return {
        title,
        year: year || undefined,
        poster: poster || undefined,
        description: description || (studio ? `Studio: ${studio}` : undefined),
        cast: cast.slice(0, 20),
        links: [{ name: 'View on GayDVDEmpire', category: 'GayDVDEmpire', url }],
    };
}
