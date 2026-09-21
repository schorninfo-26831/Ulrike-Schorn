import { blocks } from './blocks/index.js';
import { themeCss } from './blocks/_theme.js';
import { escapeHtml } from './blocks/_util.js';
import { loadSite, loadFacts } from './config.js';

/**
 * Das Fakten-Tor (P2): {{facts.pfad}} → Wert. Fehlt der Wert, erscheint sichtbar […]
 * statt einer Erfindung. Läuft zweimal: vor dem Baustein auf dessen Daten (damit ein
 * Link-Ziel aus den Fakten die ziel()-Prüfung besteht) und zum Schluss über das
 * fertige HTML für alles, was nicht durch einen Baustein ging (Titel, Beschreibung).
 */
function stemple(text, facts, { escape }) {
  return String(text).replace(/\{\{facts\.([\w.]+)\}\}/g, (_, pfad) => {
    const wert = pfad.split('.').reduce((o, k) => (o ?? {})[k], facts);
    if (wert == null || wert === '') {
      console.warn(`[Motor] [WARN] Fakt fehlt: ${pfad}`);
      return '[…]';
    }
    return escape ? escapeHtml(String(wert)) : String(wert);
  });
}

/** Stempelt in die Tiefe: auch Listen (Karten) und verschachtelte Objekte. */
function stempleDaten(wert, facts) {
  if (typeof wert === 'string') return stemple(wert, facts, { escape: false });
  if (Array.isArray(wert)) return wert.map((v) => stempleDaten(v, facts));
  if (wert && typeof wert === 'object') {
    return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, stempleDaten(v, facts)]));
  }
  return wert;
}

/**
 * Reine Funktion: gleiche Daten, gleiches HTML, immer. Die Fakten kommen von außen
 * (mit Cockpit-Overrides) oder, ohne Angabe, aus der Datei.
 */
export function renderPage(page, { dynamicData = {}, facts = loadFacts() } = {}) {
  const site = loadSite();
  const inhalt = typeof page.content_json === 'string'
    ? JSON.parse(page.content_json) : page.content_json;
  const liste = inhalt.blocks || [];

  const benutzt = [...new Set(liste.map((b) => b.type))];
  const css = benutzt.map((t) => blocks[t]?.css || '').join('\n');

  const koerper = liste.map((eintrag) => {
    const block = blocks[eintrag.type];
    if (!block) {
      // Laut sein: ein unbekannter Baustein verschwindet sonst stumm und
      // die Seite bleibt 200, aber leer. Das ist die fieseste Fehlerart.
      console.warn(`[Motor] [WARN] Unbekannter Baustein: ${eintrag.type}`);
      return '';
    }
    const vorgaben = Object.fromEntries(
      Object.entries(block.schema).map(([k, v]) => [k, v.default]));
    const daten = stempleDaten(
      { ...vorgaben, ...(eintrag.data || {}), ...(dynamicData[eintrag.type] || {}) }, facts);
    const out = block.render(daten);
    return out?.__raw ? out.value : String(out);
  }).join('\n');

  const titel = escapeHtml(page.title || site.name) + escapeHtml(site.titleSuffix || '');
  const beschreibung = escapeHtml(page.description || site.beschreibung || '');
  const ogImage = page.og_image ? `<meta property="og:image" content="${escapeHtml(page.og_image)}">` : '';

  return stemple(`<!doctype html>
<html lang="${escapeHtml(site.locale || 'de')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titel}</title>
<meta name="description" content="${beschreibung}">
<meta property="og:title" content="${escapeHtml(page.title || site.name)}">
<meta property="og:description" content="${beschreibung}">
<meta property="og:type" content="website">
${ogImage}
<link rel="icon" href="/img/schorni-logo.png" type="image/png">
${page.status === 'published' ? '' : '<meta name="robots" content="noindex">'}
<style>${themeCss()}${css}</style>
</head>
<body>${koerper}</body>
</html>`, facts, { escape: true });
}
