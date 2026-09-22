/**
 * Öffentliche Seiten. Kennt keine Anmeldung und schreibt nichts — mit einer Ausnahme:
 * dem Formular-Endpunkt, der die eine Handlung entgegennimmt (3.7).
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { query, queryOne } from '../db.js';
import { renderPage } from '../renderer.js';
import { ladeFakten } from '../fakten.js';
import { ladeBaum } from '../navigation.js';
import { ladeBestand } from '../bestand.js';
import { cache } from '../cache.js';
import { loadSite } from '../config.js';
import { escapeHtml } from '../blocks/_util.js';
import { basisUrl } from '../oeffentlich.js';
import { zaehle } from '../zugriffe.js';
import { benachrichtige } from '../mail.js';

export const publicRouter = Router();

// Umleitungen: vor allen Seitenrouten, nach den statischen Dateien (3.4).
publicRouter.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  try {
    const p = req.path.endsWith('/') ? req.path : `${req.path}/`;
    const ziel = await queryOne('SELECT to_path, code FROM redirects WHERE from_path = $1', [p]);
    if (!ziel) return next();
    res.redirect(ziel.code || 301, ziel.to_path);
  } catch (err) { next(err); }
});

// Was beim Veröffentlichen mitläuft (3.5): Sitemap und robots aus dem Bestand, nie von Hand.
publicRouter.get('/sitemap.xml', async (req, res, next) => {
  try {
    const basis = basisUrl(loadSite(), req);
    const seiten = await query("SELECT slug, updated_at FROM pages WHERE status = 'published' ORDER BY slug");
    const urls = seiten.map((s) => `  <url><loc>${basis}/${s.slug === 'start' ? '' : `${s.slug}/`}</loc><lastmod>${escapeHtml(s.updated_at.slice(0, 10))}</lastmod></url>`).join('\n');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  } catch (err) { next(err); }
});

publicRouter.get('/robots.txt', (req, res) => {
  const basis = basisUrl(loadSite(), req);
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${basis}/sitemap.xml\n`);
});

// Die eine Handlung landet hier (3.7): Honigtopf, ZUERST speichern, DANN benachrichtigen.
publicRouter.post('/api/form/:name', async (req, res, next) => {
  try {
    if (!/^[a-z0-9-]{1,40}$/.test(req.params.name)) return res.status(400).json({ error: 'Formularname ungültig' });
    const { website, ...daten } = req.body || {};       // 1. Honigtopf
    const willJson = (req.get('accept') || '').includes('application/json');
    const danke = () => willJson ? res.json({ ok: true }) : res.type('html').send(dankeSeite(req.get('referer')));
    if (website) return danke();                        //    Bots füllen ihn aus

    // 2. ZUERST speichern, DANN benachrichtigen. Nie umgekehrt.
    const id = randomUUID();
    const anfrage = { id, form: req.params.name, page_slug: daten._seite || null, daten, created_at: new Date().toISOString() };
    await query(
      `INSERT INTO submissions (id, form, page_slug, daten, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [id, anfrage.form, anfrage.page_slug, JSON.stringify(daten), anfrage.created_at]);

    // 3. Die Mail darf scheitern, ohne die Anfrage zu verlieren (src/mail.js; nur mit SMTP_URL und MAIL_TO).
    const site = loadSite();
    try { await benachrichtige(anfrage, { site, basis: basisUrl(site, req) }); }
    catch (err) { console.error(`[Motor] [ERROR] Mail zu ${id}: ${err.message}`); }

    danke();
  } catch (err) { next(err); }
});

const dankeSeite = (zurueck) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Danke – Camping Schorni</title><style>body{font-family:system-ui,sans-serif;background:#F1ECE3;color:#16242F;margin:0;padding:48px 20px;text-align:center}a{color:#0B3B5C}</style></head><body><h1>Danke, deine Anfrage ist angekommen.</h1><p>Wir melden uns.</p><p><a href="${escapeHtml(zurueck || '/')}">Zurück zur Seite</a></p></body></html>`;

// Öffentliche Seiten: Slug → veröffentlichte Seite → HTML. Mit und ohne Schrägstrich.
publicRouter.get(/^\/(.*)$/, async (req, res, next) => {
  try {
    const slug = (req.params[0] || 'start').replace(/\/+$/, '') || 'start';
    if (/^(admin|api|uploads|fonts|img)(\/|$)/.test(slug)) return next();
    const basis = basisUrl(loadSite(), req);
    const schluessel = `${basis}|${slug}`;
    const gezaehlt = () => { if (req.method === 'GET') zaehle(slug === 'start' ? '/' : `/${slug}/`, req.get('user-agent')); };
    const treffer = cache.get(schluessel);
    if (treffer) { gezaehlt(); return res.type('html').send(treffer); }

    const page = await queryOne("SELECT * FROM pages WHERE slug = $1 AND status = 'published'", [slug]);
    if (!page) return next();

    const html = renderPage(page, {
      facts: await ladeFakten(),
      dynamicData: await dynamik(page),
      basis,
    });
    cache.set(schluessel, html);
    gezaehlt();
    res.type('html').send(html);
  } catch (err) { next(err); }
});

/** Was der Renderer von außen braucht: Menübaum und Seitenbezug fürs Formular (P3). */
export async function dynamik(page) {
  const baum = await ladeBaum();
  // Übersichten (Stufe 6) lesen den Bestand bei jedem Aufruf — die Seite speichert keine Liste.
  const seiten = await ladeBestand();
  return { nav: { baum }, footer: { baum }, form: { seite: page.slug }, liste: { seiten, eigenerSlug: page.slug } };
}
