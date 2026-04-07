/**
 * gay-movie.org scraper
 * A WordPress + Avada/Fusion theme blog aggregating gay adult content
 * (from PGMA stremio-plex-agents repo, GayMovie.bundle agent)
 *
 * Browse: https://gay-movie.org/page/{N}/
 * Search: https://gay-movie.org/?s={query}
 *
 * HTML structure (Avada/Fusion theme):
 *  <article id="blog-1-post-XXXXX" class="fusion-post-grid ...">
 *    <img class="wp-post-image" src="...">
 *    <h4 class="fusion-rollover-title"><a href="URL">Title</a></h4>
 *    <h2 class="fusion-post-title"><a href="URL">Title</a></h2>
 */
import got from 'got';
import * as cheerio from 'cheerio';

const BASE = 'https://gay-movie.org';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';

async function fetchHtml(url) {
    const res = await got(url, {
        headers: { 'User-Agent': UA },
        timeout: { request: 15000 },
        followRedirect: true,
    });
    return cheerio.load(res.body);
}

function parseArticles($) {
    const results = [];
    $('article').each((_i, el) => {
        try {
            const $el = $(el);

            // Title — Fusion theme uses fusion-rollover-title or fusion-post-title
            const titleEl = $el.find('h2.fusion-post-title a, h4.fusion-rollover-title a, .fusion-post-title a').first();
            const title = titleEl.text().trim();
            const link = titleEl.attr('href')
                || $el.find('a.fusion-rollover-title-link').first().attr('href')
                || $el.find('a[href*="gay-movie.org"]').first().attr('href')
                || '';

            if (!title || !link) return;

            // Poster — wp-post-image is the featured image
            const poster = $el.find('img.wp-post-image').first().attr('src')
                || $el.find('img').first().attr('src')
                || '';

            // Date
            const rawDate = $el.find('time.updated, time.entry-date, .fusion-date').first().attr('datetime')
                || $el.find('time').first().attr('datetime')
                || $el.find('.fusion-date').first().text().trim()
                || '';

            const slug = Buffer.from(link).toString('base64url');
            results.push({
                id: `adult:gaymovie:${slug}`,
                type: 'movie',
                name: title,
                poster: (poster && poster.startsWith('http')) ? poster : undefined,
                releaseInfo: rawDate ? rawDate.slice(0, 10) : undefined,
                description: `gay-movie.org`,
            });
        } catch {}
    });
    return results;
}

export async function browseGayMovie(page = 0) {
    const url = page > 0 ? `${BASE}/page/${page + 1}/` : `${BASE}/`;
    const $ = await fetchHtml(url);
    return parseArticles($);
}

export async function searchGayMovie(query) {
    const q = encodeURIComponent(query);
    const url = `${BASE}/?s=${q}`;
    const $ = await fetchHtml(url);
    return parseArticles($);
}

export async function getGayMovieMeta(url) {
    const $ = await fetchHtml(url);

    const title = $('h1.fusion-post-title, h1.entry-title, h1').first().text().trim()
        || $('title').text().replace(/\s*[\|\-].*$/, '').trim();

    // Featured image
    const poster = $('img.wp-post-image, .post-thumbnail img').first().attr('src')
        || $('.entry-content img').first().attr('src')
        || '';

    const rawDate = $('time[datetime]').first().attr('datetime')
        || $('time').first().text().trim() || '';

    const description = $('.entry-content p').first().text().trim()
        || $('meta[name="description"]').attr('content') || '';

    // Tags as cast
    const cast = [];
    $('a[rel="tag"], a[href*="/tag/"]').each((_i, el) => {
        const name = $(el).text().trim();
        if (name && !cast.find(c => c.name === name)) cast.push({ name });
    });

    // Categories as genres
    const genres = [];
    $('a[href*="/category/"]').each((_i, el) => {
        const g = $(el).text().trim();
        if (g) genres.push(g);
    });

    return {
        title,
        poster: (poster && poster.startsWith('http')) ? poster : undefined,
        releaseInfo: rawDate ? rawDate.slice(0, 10) : undefined,
        description: description || undefined,
        cast: cast.slice(0, 20),
        genres: genres.length ? genres : undefined,
        links: [{ name: 'View on gay-movie.org', category: 'gay-movie.org', url }],
    };
}
