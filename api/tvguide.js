// api/tvguide.js — جدول القنوات العربية
const { fetchElcinema, parseTvGuide } = require('../lib/scraper');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800');
  try {
    const html = await fetchElcinema('/tvsummary/');
    const data = parseTvGuide(html);
    res.json({ ok: true, results: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
