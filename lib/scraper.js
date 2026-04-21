// lib/scraper.js — محرك السحب الأساسي
const cheerio = require('cheerio');

const BASE = 'https://elcinema.com';
const MEDIA_BASE = 'https://media0101.elcinema.com';

async function fetchElcinema(path) {
  const url = BASE + path;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      'Accept-Language': 'ar,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml',
      'Referer': BASE
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ─── يعرض حالياً ────────────────────────────────────────────
function parseNowPlaying(html) {
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  // الأفلام المعروضة - كل رابط work مع صورة
  $('a[href^="/work/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (seen.has(href)) return;
    seen.add(href);

    const id = href.match(/\/work\/(\d+)\//)?.[1];
    if (!id) return;

    // الصورة من img داخل نفس الـ container أو أخته
    const container = $(el).closest('li, div, article');
    let poster = container.find('img').first().attr('src') || '';
    // تحويل الصور إلى المسار الكامل
    if (poster && !poster.startsWith('http')) poster = MEDIA_BASE + poster;
    // تجاهل الصور الصغيرة جداً (أيقونات)
    if (poster.includes('assets/')) poster = '';

    const title = $(el).text().trim() ||
      container.find('img').first().attr('alt') || '';
    if (!title || title.length < 2) return;

    const bookingLink = container.find('a[href*="/booking/"]').attr('href');

    results.push({
      id,
      title,
      url: BASE + href,
      poster: poster || null,
      booking: bookingLink ? BASE + bookingLink : null,
      elcinema_id: id
    });
  });

  return results.slice(0, 30);
}

// ─── جدول القنوات ─────────────────────────────────────────
function parseTvGuide(html) {
  const $ = cheerio.load(html);
  const results = [];

  // كل صف في جدول القنوات
  $('li, .summary-item, article').each((_, el) => {
    const workLink = $(el).find('a[href^="/work/"]').first();
    const channelLink = $(el).find('a[href^="/tvguide/"]').first();

    const title = workLink.text().trim();
    const channel = channelLink.text().trim();
    const workHref = workLink.attr('href');
    const channelHref = channelLink.attr('href');

    if (!title || !workHref) return;

    const id = workHref.match(/\/work\/(\d+)\//)?.[1];
    if (!id) return;

    // الوقت - نص بعد اسم القناة
    const rawText = $(el).text();
    const timeMatch = rawText.match(/(\d{1,2}:\d{2}\s*[صم]بح[اً]?|مساءً?)/);

    // نوع العمل
    let type = 'فيلم';
    const typeText = rawText;
    if (typeText.includes('مسلسل')) type = 'مسلسل';
    else if (typeText.includes('برنامج') || typeText.includes('ﺑﺮﻧﺎﻣﺞ')) type = 'برنامج';

    // الصورة
    let poster = $(el).find('img').first().attr('src') || '';
    if (poster && !poster.startsWith('http')) poster = MEDIA_BASE + poster;
    if (poster.includes('assets/') || poster.includes('vod_platforms')) poster = '';

    // رابط المنصة إن وجد
    const vodLink = $(el).find('a[href*="watchit"], a[href*="shahid"], a[href*="sling"]').first().attr('href');

    results.push({
      id,
      title,
      channel,
      channel_url: channelHref ? BASE + channelHref : null,
      time: timeMatch ? timeMatch[0] : null,
      type,
      url: BASE + workHref,
      poster: poster || null,
      streaming_url: vodLink || null
    });
  });

  // إزالة التكرار بناءً على id
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).slice(0, 40);
}

// ─── مسلسلات رمضان ────────────────────────────────────────
function parseRamadan(html) {
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $('a[href^="/work/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (seen.has(href)) return;
    seen.add(href);

    const id = href.match(/\/work\/(\d+)\//)?.[1];
    if (!id) return;

    const container = $(el).closest('li, div.work, article, td');
    let poster = container.find('img').first().attr('src') || '';
    if (poster && !poster.startsWith('http')) poster = MEDIA_BASE + poster;
    if (poster.includes('assets/')) poster = '';

    const title = $(el).text().trim() ||
      container.find('img').attr('alt') || '';
    if (!title || title.length < 2) return;

    // استخراج سنة الإصدار
    const rawText = container.text();
    const yearMatch = rawText.match(/20\d{2}/);

    // رابط بث إن وجد
    const streamLink = container.find('a[href*="watchit"], a[href*="shahid"], a[href*="sling"], a[href*="youtube"]').first();

    results.push({
      id,
      title,
      url: BASE + href,
      poster: poster || null,
      year: yearMatch ? yearMatch[0] : new Date().getFullYear().toString(),
      streaming_url: streamLink.attr('href') || null,
      streaming_platform: streamLink.text().trim() || null
    });
  });

  return results.slice(0, 50);
}

module.exports = { fetchElcinema, parseNowPlaying, parseTvGuide, parseRamadan };
