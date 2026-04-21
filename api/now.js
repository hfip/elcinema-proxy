// api/now.js — يعرض حالياً في السينمات
const { fetchElcinema, parseNowPlaying } = require('../lib/scraper');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');
  try {
    const html = await fetchElcinema('/now/');
    const data = parseNowPlaying(html);
    res.json({ ok: true, results: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
