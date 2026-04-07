/**
 * WayBig.com scraper
 * Search: https://www.waybig.com/blog/index.php?s={query}
 * Browse: https://www.waybig.com/blog/ (and ?paged=N)
 */
import got from 'got';
import * as cheerio from 'cheerio';

const BASE = 'https://www.waybig.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';

async function fetchHtml(url) {
    const res = await got(url, {
        headers: { 'User-Agent': UA },
        timeout: { request: 15000 },
        followRedirect: true,
    });
    return cheerio.load(res.body);
}

function parseArticles($, articles) {
    const results = [];
    articles.each((_i, el) => {
        try {
            const $el = $(el);
            const titleEl = $el.find('.entry-title, h2.title').first();
            const title = titleEl.text().trim();
            const link = $el.find('a[rel="bookmark"], h2 a, .entry-title a').first().attr('href') || '';
            const rawDate = $el.find('.meta-date strong, .entry-date').first().text().trim();
            const poster = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';

            if (!title || !link) return;

            const slug = Buffer.from(link).toString('base64url');
            results.push({
                id: `adult:waybig:${slug}`,
                type: 'movie',
                name: title,
                poster: poster || undefined,
                releaseInfo: rawDate || undefined,
                description: `WayBig — ${rawDate}`,
            });
        } catch {}
    });
    return results;
}

export async function browseWayBig(page = 0) {
    const url = page > 0
        ? `${BASE}/blog/?paged=${page + 1}`
        : `${BASE}/blog/`;
    const $ = await fetchHtml(url);
    const articles = $('article.post, div.content-col article');
    return parseArticles($, articles);
}

export async function searchWayBig(query) {
    const q = encodeURIComponent(query.slice(0, 50));
    const url = `${BASE}/blog/index.php?s=${q}`;
    const $ = await fetchHtml(url);
    const articles = $('article.post, div.content-col article');
    return parseArticles($, articles);
}

export async function getWayBigMeta(url) {
    const $ = await fetchHtml(url);

    const title = $('h1.entry-title, h1.title').first().text().trim()
        || $('title').text().replace('- WayBig', '').trim();

    const poster = $('article img, .entry-content img').first().attr('src')
        || $('article img').first().attr('data-src') || '';

    const rawDate = $('.meta-date strong, .entry-date').first().text().trim();
    const description = $('.entry-content p').first().text().trim();

    const cast = [];
    $('a[href*="/actor/"], a[href*="/performer/"]').each((_i, el) => {
        const name = $(el).text().trim();
        if (name) cast.push({ name });
    });

    return {
        title,
        poster: poster || undefined,
        releaseInfo: rawDate || undefined,
        description: description || undefined,
        cast: cast.length ? cast : undefined,
        links: [{ name: 'View on WayBig', category: 'WayBig', url }],
    };
}
