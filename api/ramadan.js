// api/ramadan.js — مسلسلات رمضان
const { fetchElcinema, parseRamadan } = require('../lib/scraper');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=7200');
  try {
    const year = new Date().getFullYear();
    const html = await fetchElcinema(`/ramadan/${year}/`);
    const data = parseRamadan(html);
    res.json({ ok: true, results: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
