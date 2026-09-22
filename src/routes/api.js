/**
 * Cockpit-API. Alles hier verlangt die Anmeldung (Absicherung, Stufe 3) — mit einer
 * Ausnahme: dem Login selbst. Jede Änderung leert den Render-Cache.
 */
import { Router } from 'express';
import express from 'express';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { extname } from 'node:path';
import { query, queryOne } from '../db.js';
import { validateContent, getType, listTypes } from '../archetypes.js';
import { blocks, pruefeBloecke } from '../blocks/index.js';
import { renderPage } from '../renderer.js';
import { ladeFakten, speichereFakten } from '../fakten.js';
import { ladeBaumRoh } from '../navigation.js';
import { cache } from '../cache.js';
import { loadFacts, loadSite } from '../config.js';
import { Anmeldebremse, basisUrl } from '../oeffentlich.js';
import { statistik } from '../zugriffe.js';
import { mailKonfiguriert } from '../mail.js';
import { indexiereSeite, entferneSeite, indexiereAlles, assistentStatus } from '../assistent.js';
import { loadAssistent } from '../config.js';
import { STATUS, normalisiereSlug, neuerInhalt, brauchtUmleitung, naechsterStatus, pfad } from '../pages.js';
import { dynamik } from './public.js';
import { generiere, ladeModell, generatorStatus } from '../generator.js';
import {
  anmeldungNoetig, passwortStimmt, passwortKonfiguriert, neueSitzung, sitzungBeenden,
  cookieSetzen, parseCookies, COOKIE,
} from '../auth.js';

export const apiRouter = Router();
const jetzt = () => new Date().toISOString();
const fehler = (res, code, text) => res.status(code).json({ error: text });

// ---- Anmeldung ---------------------------------------------------------------
apiRouter.get('/status', (_req, res) => res.json({ passwortKonfiguriert: passwortKonfiguriert() }));

// Öffentlich heißt: jemand probiert Passwörter. Nach zehn Fehlversuchen je Absender ist 15 Minuten Pause.
const bremse = new Anmeldebremse();
apiRouter.post('/login', (req, res) => {
  const wer = req.ip || 'unbekannt';
  if (bremse.gesperrt(wer)) return fehler(res, 429, `Zu viele Fehlversuche. Bitte ${Math.max(1, Math.ceil(bremse.wartezeitSek(wer) / 60))} Minuten warten.`);
  if (!passwortKonfiguriert()) return fehler(res, 503, 'ADMIN_PASSWORD ist nicht gesetzt (.env)');
  if (!passwortStimmt(req.body?.passwort)) { bremse.fehlversuch(wer); return fehler(res, 401, 'Passwort stimmt nicht'); }
  bremse.erfolg(wer);
  cookieSetzen(res, neueSitzung(), req);
  res.json({ ok: true });
});

apiRouter.post('/logout', (req, res) => {
  sitzungBeenden(parseCookies(req.headers.cookie)[COOKIE]);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

// Ab hier nur angemeldet — außer dem Formular-Endpunkt: der ist öffentlich und liegt im
// public-Router. next('router') lässt ihn an diesem Router vorbei.
apiRouter.use((req, res, next) => (req.path.startsWith('/form/') || req.path.startsWith('/chat') ? next('router') : anmeldungNoetig(req, res, next)));
apiRouter.get('/me', (_req, res) => res.json({ ok: true }));

// ---- Stammdaten fürs Cockpit -------------------------------------------------
apiRouter.get('/types', (_req, res) => res.json(listTypes()));
apiRouter.get('/blocks', (_req, res) => res.json(
  Object.values(blocks).map((b) => ({ name: b.name, label: b.label, schema: b.schema }))));
apiRouter.get('/statuses', (_req, res) => res.json(STATUS));

// ---- Seiten (3.1) --------------------------------------------------------------
apiRouter.get('/pages', async (_req, res, next) => {
  try {
    res.json(await query('SELECT id, slug, page_type, status, title, updated_at FROM pages ORDER BY updated_at DESC'));
  } catch (err) { next(err); }
});

apiRouter.post('/pages', async (req, res, next) => {
  try {
    const { page_type, title } = req.body || {};
    const typ = getType(page_type);
    if (!typ) return fehler(res, 400, 'Unbekannter Seitentyp');
    const slug = normalisiereSlug(req.body?.slug || title);
    if (!slug) return fehler(res, 400, 'Titel oder Slug fehlt');
    if (await queryOne('SELECT id FROM pages WHERE slug = $1', [slug])) return fehler(res, 409, `Slug „${slug}" gibt es schon`);
    const id = randomUUID();
    const zeit = jetzt();
    // Jeder Platzhalter genau einmal: der SQLite-Zweig übersetzt $n positionsweise in ?.
    await query(
      `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at)
       VALUES ($1, $2, $3, 'draft', $4, '', $5, $6, $7)`,
      [id, slug, page_type, String(title || slug), JSON.stringify(neuerInhalt(typ)), zeit, zeit]);
    const neu = await queryOne('SELECT * FROM pages WHERE id = $1', [id]);
    res.status(201).json({ ...neu, content_json: JSON.parse(neu.content_json) });
  } catch (err) { next(err); }
});

apiRouter.get('/pages/:id', async (req, res, next) => {
  try {
    const page = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    if (!page) return fehler(res, 404, 'Seite nicht gefunden');
    res.json({ ...page, content_json: JSON.parse(page.content_json) });
  } catch (err) { next(err); }
});

apiRouter.put('/pages/:id', async (req, res, next) => {
  try {
    const alt = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    if (!alt) return fehler(res, 404, 'Seite nicht gefunden');
    const b = req.body || {};
    const inhalt = b.content ?? JSON.parse(alt.content_json);

    const vertrag = validateContent(alt.page_type, inhalt);
    const bloecke = pruefeBloecke(inhalt.blocks);
    if (!vertrag.ok || bloecke.length) return fehler(res, 400, [...vertrag.fehler, ...bloecke].join(' · '));

    const slug = normalisiereSlug(b.slug ?? alt.slug);
    if (!slug) return fehler(res, 400, 'Slug fehlt');
    if (slug !== alt.slug && await queryOne('SELECT id FROM pages WHERE slug = $1', [slug])) return fehler(res, 409, `Slug „${slug}" gibt es schon`);

    // Slug-Wechsel einer öffentlichen Seite hinterlässt eine Spur — ungefragt (3.1).
    if (brauchtUmleitung(alt, slug)) {
      await query('DELETE FROM redirects WHERE from_path = $1', [pfad(alt.slug)]);
      await query('INSERT INTO redirects (from_path, to_path, code, created_at) VALUES ($1, $2, 301, $3)',
        [pfad(alt.slug), pfad(slug), jetzt()]);
    }

    const status = naechsterStatus(alt, b.status);
    await query(
      `UPDATE pages SET slug = $1, title = $2, description = $3, og_image = $4, status = $5, content_json = $6, chat_excluded = $7, updated_at = $8 WHERE id = $9`,
      [slug, String(b.title ?? alt.title ?? ''), String(b.description ?? alt.description ?? ''),
        b.og_image ?? alt.og_image ?? null, status, JSON.stringify(inhalt),
        b.chat_excluded === undefined ? Number(alt.chat_excluded || 0) : (b.chat_excluded ? 1 : 0), jetzt(), alt.id]);
    cache.clear();
    const neu = await queryOne('SELECT * FROM pages WHERE id = $1', [alt.id]);
    // Stufe 7: erst die alten Stücke weg (auch unter dem alten Slug), dann die neuen — in einem Vorgang.
    if (slug !== alt.slug) await entferneSeite(alt.slug);
    await indexiereSeite(neu).catch((err) => console.error(`[Motor] [WARN] Index ${slug}: ${err.message}`));
    res.json({ ...neu, content_json: JSON.parse(neu.content_json), umleitung: brauchtUmleitung(alt, slug) ? `${pfad(alt.slug)} → ${pfad(slug)}` : null });
  } catch (err) { next(err); }
});

apiRouter.delete('/pages/:id', async (req, res, next) => {
  try {
    const alt = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    if (!alt) return fehler(res, 404, 'Seite nicht gefunden');
    if (alt.slug === 'start') return fehler(res, 400, 'Die Startseite bleibt.');
    if (alt.status === 'published') {
      const ziel = String(req.body?.to_path || '').trim();
      if (!/^\/[a-z0-9-]*\/?$/.test(ziel)) return fehler(res, 400, 'Eine veröffentlichte Seite braucht ein Umleitungsziel (z. B. /wasser-ratgeber/)');
      await query('DELETE FROM redirects WHERE from_path = $1', [pfad(alt.slug)]);
      await query('INSERT INTO redirects (from_path, to_path, code, created_at) VALUES ($1, $2, 301, $3)',
        [pfad(alt.slug), ziel.endsWith('/') ? ziel : `${ziel}/`, jetzt()]);
    }
    await query('DELETE FROM pages WHERE id = $1', [alt.id]);
    await entferneSeite(alt.slug);
    cache.clear();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Vorschau jeder Seite, auch Entwürfe — nur angemeldet.
apiRouter.get('/preview/:id', async (req, res, next) => {
  try {
    const page = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    if (!page) return fehler(res, 404, 'Seite nicht gefunden');
    res.set('Cache-Control', 'no-store');
    res.type('html').send(renderPage(page, { facts: await ladeFakten(), dynamicData: await dynamik(page), basis: basisUrl(loadSite(), req) }));
  } catch (err) { next(err); }
});

// ---- Generator (Stufe 4) ------------------------------------------------------
// Liefert JSON gegen den Vertrag; gespeichert wird als 'generated'. Ein Mensch entscheidet.
const OHNE_SCHLUESSEL = 'ANTHROPIC_API_KEY ist nicht gesetzt (.env). Ohne Schlüssel kein Generator.';
apiRouter.get('/generate/status', (_req, res) => res.json(generatorStatus()));

apiRouter.post('/generate', async (req, res, next) => {
  try {
    const { page_type, title, quelle } = req.body || {};
    const typ = getType(page_type);
    if (!typ) return fehler(res, 400, 'Unbekannter Seitentyp');
    const slug = normalisiereSlug(req.body?.slug || title);
    if (!slug) return fehler(res, 400, 'Titel oder Slug fehlt');
    if (!String(quelle || '').trim()) return fehler(res, 400, 'Quelle fehlt: Notizen, Stichworte oder ein Diktat');
    if (!generatorStatus().bereit) return fehler(res, 503, OHNE_SCHLUESSEL);
    if (await queryOne('SELECT id FROM pages WHERE slug = $1', [slug])) return fehler(res, 409, `Slug „${slug}" gibt es schon`);
    let ergebnis;
    try {
      ergebnis = await generiere({ typ: page_type, quelle, titel: String(title || ''), modell: await ladeModell(), facts: await ladeFakten() });
    } catch (err) { return fehler(res, 422, err.message); }
    const id = randomUUID();
    const zeit = jetzt();
    await query(
      `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at)
       VALUES ($1, $2, $3, 'generated', $4, $5, $6, $7, $8)`,
      [id, slug, page_type, ergebnis.title || slug, ergebnis.description, JSON.stringify(ergebnis.content), zeit, zeit]);
    const neu = await queryOne('SELECT * FROM pages WHERE id = $1', [id]);
    res.status(201).json({ ...neu, content_json: JSON.parse(neu.content_json), hinweise: ergebnis.hinweise, verbrauch: ergebnis.verbrauch });
  } catch (err) { next(err); }
});

// Eine bestehende Seite neu schreiben lassen. Von Hand bearbeitete Seiten nur mit force (P5: nichts
// wird stillschweigend überschrieben); veröffentlichte nie — sonst ginge ungelesener Text sofort live (P7).
apiRouter.post('/pages/:id/generate', async (req, res, next) => {
  try {
    const alt = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    if (!alt) return fehler(res, 404, 'Seite nicht gefunden');
    const { quelle, force } = req.body || {};
    if (!String(quelle || '').trim()) return fehler(res, 400, 'Quelle fehlt: Notizen, Stichworte oder ein Diktat');
    if (!generatorStatus().bereit) return fehler(res, 503, OHNE_SCHLUESSEL);
    if (alt.status === 'published' || alt.status === 'archived') return fehler(res, 409, 'Veröffentlichte und archivierte Seiten werden nicht neu generiert. Leg dafür eine neue Seite an.');
    if ((alt.status === 'edited' || alt.status === 'approved') && force !== true) return fehler(res, 409, 'Diese Seite wurde von Hand bearbeitet. Neu generieren überschreibt das — nur mit ausdrücklicher Bestätigung.');
    let ergebnis;
    try {
      ergebnis = await generiere({ typ: alt.page_type, quelle, titel: alt.title || '', modell: await ladeModell(), facts: await ladeFakten() });
    } catch (err) { return fehler(res, 422, err.message); }
    await query(
      `UPDATE pages SET title = $1, description = $2, status = 'generated', content_json = $3, updated_at = $4 WHERE id = $5`,
      [ergebnis.title || alt.title, ergebnis.description || alt.description || '', JSON.stringify(ergebnis.content), jetzt(), alt.id]);
    cache.clear();
    const neu = await queryOne('SELECT * FROM pages WHERE id = $1', [alt.id]);
    res.json({ ...neu, content_json: JSON.parse(neu.content_json), hinweise: ergebnis.hinweise, verbrauch: ergebnis.verbrauch });
  } catch (err) { next(err); }
});

// ---- Navigation (3.2) ----------------------------------------------------------
apiRouter.get('/navigation', async (_req, res, next) => {
  try { res.json(await ladeBaumRoh()); } catch (err) { next(err); }
});

apiRouter.put('/navigation', async (req, res, next) => {
  try {
    const baum = Array.isArray(req.body) ? req.body : [];
    const okHref = (h) => /^(\/[a-z0-9-]*\/?|https:\/\/\S+|#\S*)$/.test(String(h || ''));
    for (const p of baum) {
      if (!String(p.label || '').trim() || !okHref(p.href)) return fehler(res, 400, `Menüpunkt ungültig: „${p.label}" → „${p.href}"`);
      for (const k of p.kinder || []) if (!String(k.label || '').trim() || !okHref(k.href)) return fehler(res, 400, `Unterpunkt ungültig: „${k.label}" → „${k.href}"`);
    }
    await query('DELETE FROM navigation');
    let sort = 0;
    for (const p of baum) {
      const id = randomUUID();
      await query('INSERT INTO navigation (id, parent_id, label, href, sort, visible) VALUES ($1, NULL, $2, $3, $4, 1)', [id, p.label.trim(), p.href.trim(), sort++]);
      for (const k of p.kinder || []) {
        await query('INSERT INTO navigation (id, parent_id, label, href, sort, visible) VALUES ($1, $2, $3, $4, $5, 1)', [randomUUID(), id, k.label.trim(), k.href.trim(), sort++]);
      }
    }
    cache.clear();
    res.json(await ladeBaumRoh());
  } catch (err) { next(err); }
});

// ---- Medien (3.3) ---------------------------------------------------------------
const BILDTYPEN = { '.png': 'png', '.jpg': 'jpg', '.jpeg': 'jpg', '.webp': 'webp', '.gif': 'gif' };

apiRouter.get('/media', async (_req, res, next) => {
  try { res.json(await query('SELECT * FROM media ORDER BY created_at DESC')); } catch (err) { next(err); }
});

apiRouter.post('/media', express.raw({ type: () => true, limit: '20mb' }), async (req, res, next) => {
  try {
    const name = String(req.query.name || '');
    const alt = String(req.query.alt || '').trim();
    const ext = extname(name).toLowerCase();
    if (!BILDTYPEN[ext]) return fehler(res, 400, 'Erlaubt: PNG, JPG, WebP, GIF');
    if (!alt) return fehler(res, 400, 'Alt-Text ist Pflicht');
    if (!Buffer.isBuffer(req.body) || !req.body.length) return fehler(res, 400, 'Keine Datei');
    // Dateiname mit Inhalts-Hash: wer denselben Namen neu hochlädt, kämpft sonst gegen den Browser-Cache.
    const hash = createHash('sha1').update(req.body).digest('hex').slice(0, 6);
    const basis = normalisiereSlug(name.slice(0, -ext.length)) || 'bild';
    const datei = `${basis}-${hash}.${BILDTYPEN[ext]}`;
    mkdirSync('data/uploads', { recursive: true });
    writeFileSync(`data/uploads/${datei}`, req.body);
    const id = randomUUID();
    await query('INSERT INTO media (id, file_path, alt, bytes, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, `/uploads/${datei}`, alt, req.body.length, jetzt()]);
    res.status(201).json(await queryOne('SELECT * FROM media WHERE id = $1', [id]));
  } catch (err) { next(err); }
});

apiRouter.delete('/media/:id', async (req, res, next) => {
  try {
    const m = await queryOne('SELECT * FROM media WHERE id = $1', [req.params.id]);
    if (!m) return fehler(res, 404, 'Bild nicht gefunden');
    const p = `data${m.file_path}`;
    if (existsSync(p)) unlinkSync(p);
    await query('DELETE FROM media WHERE id = $1', [m.id]);
    cache.clear();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- Umleitungen (3.4) --------------------------------------------------------------
apiRouter.get('/redirects', async (_req, res, next) => {
  try { res.json(await query('SELECT * FROM redirects ORDER BY created_at DESC')); } catch (err) { next(err); }
});

apiRouter.post('/redirects', async (req, res, next) => {
  try {
    const von = String(req.body?.from_path || '').trim(); const zu = String(req.body?.to_path || '').trim();
    if (!/^\/[a-z0-9/-]*$/.test(von) || !/^(\/[a-z0-9/-]*|https:\/\/\S+)$/.test(zu)) return fehler(res, 400, 'Pfade: /alt/ → /neu/ oder https://…');
    const von2 = von.endsWith('/') ? von : `${von}/`;
    await query('DELETE FROM redirects WHERE from_path = $1', [von2]);
    await query('INSERT INTO redirects (from_path, to_path, code, created_at) VALUES ($1, $2, 301, $3)', [von2, zu, jetzt()]);
    cache.clear();
    res.status(201).json({ from_path: von2, to_path: zu, code: 301 });
  } catch (err) { next(err); }
});

apiRouter.delete('/redirects', async (req, res, next) => {
  try {
    await query('DELETE FROM redirects WHERE from_path = $1', [String(req.body?.from_path || '')]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- Anfragen (3.7) -----------------------------------------------------------------
apiRouter.get('/submissions', async (_req, res, next) => {
  try {
    const zeilen = await query('SELECT * FROM submissions ORDER BY created_at DESC');
    res.json(zeilen.map((z) => ({ ...z, daten: JSON.parse(z.daten) })));
  } catch (err) { next(err); }
});

apiRouter.put('/submissions/:id', async (req, res, next) => {
  try {
    await query('UPDATE submissions SET gelesen = $1 WHERE id = $2', [req.body?.gelesen ? 1 : 0, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- Öffentlich (Stufe 5): Zugriffe und Mailstatus --------------------------------
apiRouter.get('/zugriffe', async (req, res, next) => {
  try { res.json(await statistik(req.query.tage)); } catch (err) { next(err); }
});
apiRouter.get('/mail/status', (_req, res) => res.json({ konfiguriert: mailKonfiguriert(), an: mailKonfiguriert() ? process.env.MAIL_TO : '' }));

// ---- Assistent (Stufe 7) ------------------------------------------------------------
apiRouter.get('/assistent/status', async (_req, res, next) => {
  try {
    const cfg = loadAssistent();
    const status = assistentStatus(cfg);
    const seiten = await query('SELECT id, slug, title, status, chat_excluded FROM pages ORDER BY title');
    const zaehler = await query('SELECT page_slug, COUNT(*) AS n FROM chunks GROUP BY page_slug');
    const je = Object.fromEntries(zaehler.map((z) => [z.page_slug, Number(z.n)]));
    const fragen = (await query('SELECT id, frage, quellen, gewusst, created_at FROM chat_log ORDER BY created_at DESC LIMIT 100'))
      .map((f) => ({ ...f, gewusst: Number(f.gewusst) === 1, quellen: JSON.parse(f.quellen || '[]') }));
    const heute = (await queryOne('SELECT COUNT(*) AS n FROM chat_log WHERE created_at >= $1', [jetzt().slice(0, 10)]))?.n || 0;
    res.json({
      ...status, aktiv: Boolean(cfg.aktiv), chunks: Object.values(je).reduce((s, n) => s + n, 0), wissen: je['wissen/produkte'] || 0, heute: Number(heute),
      seiten: seiten.map((p) => ({ ...p, chat_excluded: Number(p.chat_excluded) === 1, chunks: je[p.slug] || 0 })), fragen,
    });
  } catch (err) { next(err); }
});
apiRouter.post('/assistent/index', async (_req, res, next) => {
  try { res.json({ chunks: await indexiereAlles() }); } catch (err) { next(err); }
});

// ---- Fakten ohne Deploy (3.8) --------------------------------------------------------
apiRouter.get('/facts', async (_req, res, next) => {
  try { res.json({ datei: loadFacts(), wirksam: await ladeFakten() }); } catch (err) { next(err); }
});

apiRouter.put('/facts', async (req, res, next) => {
  try {
    const obj = req.body;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fehler(res, 400, 'Objekt erwartet');
    await speichereFakten(obj);
    cache.clear();
    res.json({ wirksam: await ladeFakten() });
  } catch (err) { next(err); }
});

apiRouter.use((_req, res) => fehler(res, 404, 'Unbekannter Endpunkt'));
