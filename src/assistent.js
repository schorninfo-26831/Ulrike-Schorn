/**
 * Stufe 7 — der Assistent. Ein Chat, der NUR über die eigenen Inhalte spricht.
 *
 * Ablauf (WEBSITE-MOTOR.md, Stufe 7):
 *   1. Beim Veröffentlichen: alte Stücke der Seite löschen, neu zerlegen, schreiben.
 *   2. Frage kommt → Suche → Stücke.
 *   3. Stücke plus Frage ans Modell, Antwort als Strom, Quellen darunter.
 *   4. Schlägt etwas fehl, erscheint eine ehrliche Meldung — die Website bleibt bedienbar (P6).
 *
 * Abweichung von der Anleitung, bewusst: keine Embeddings. Anthropic bietet keinen Embedding-Dienst;
 * ein zweiter Anbieter wäre ein zweiter Schlüssel. Bei Website-Größe reicht die Wortsuche mit
 * Wortstämmen und Fachsynonymen — und ist der Bestand klein, bekommt das Modell ohnehin alle Stücke
 * (im zwischengespeicherten Systemteil, das kostet fast nichts). Wächst der Bestand über einige
 * hundert Stücke, ist ein Embedding-Anschluss ein Zusatz, kein Umbau: finde() ist die eine Stelle.
 *
 * Dieselbe Strenge wie bei den Fakten (P2): Zahlen nur aus den Auszügen, Sperrliste der Compliance,
 * Pflichthinweis, sobald ein Biozidprodukt genannt wird — geprüft im Code, nicht nur im Prompt.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { query, queryOne } from './db.js';
import { loadFacts } from './config.js';
import { VERBOTENE_WOERTER, STOPP_PHRASEN, nenntBiozid, schluesselVorhanden, STANDARD_MODELL } from './generator.js';

export const STANDARD_CHAT_MODELL = 'claude-sonnet-5';
/** Bis zu dieser Größe bekommt das Modell den ganzen Bestand — Suche wäre nur Rauschen. */
export const ALLES_BIS = 60;
const WISSEN_SLUG = 'wissen/produkte';
const WISSEN_TITEL = 'Geprüfte Produktdaten';

// ---- Zerlegen ---------------------------------------------------------------------------------
/** Markdown-Inline und Platzhalter-Rauschen raus; Platzhalter bleiben, sie werden beim Antworten gestempelt. */
const glatt = (s) => String(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();

/**
 * Eine Seite in suchbare Stücke zerlegen. Der Vorteil gegenüber einem HTML-Scraper: die Struktur
 * ist bekannt. nav, footer, hinweis und form stehen überall oder tragen keinen Inhalt — die würden
 * jede Suche fluten. Listen (Karten) werden je Eintrag ein Stück, weil dort die Produktangaben stehen.
 */
export function zerlege(page) {
  const inhalt = typeof page.content_json === 'string' ? JSON.parse(page.content_json) : (page.content_json || page.content || {});
  const stuecke = [];
  const seitenTitel = page.title || '';
  for (const block of inhalt.blocks || []) {
    if (['nav', 'footer', 'hinweis', 'form', 'liste'].includes(block?.type)) continue;
    const data = block?.data || {};
    const texte = [];
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) {
        for (const eintrag of v) {
          if (!eintrag || typeof eintrag !== 'object') continue;
          const t = Object.entries(eintrag).filter(([kk, vv]) => typeof vv === 'string' && !/href|label|src|bild/i.test(kk)).map(([, vv]) => glatt(vv)).filter((s) => s.length > 20);
          if (t.length) stuecke.push({ ueberschrift: glatt(eintrag.titel || ''), text: t.join(' ') });
        }
      } else if (typeof v === 'string' && v.length > 40 && !/href|src|bild|ctaHref|label/i.test(k)) {
        texte.push(glatt(v));
      }
    }
    if (texte.length) stuecke.push({ ueberschrift: glatt(data.titel || data.pill || ''), text: texte.join(' ') });
  }
  return stuecke.filter((s) => s.text.length > 20).map((s, i) => ({
    id: `${page.slug}#${i}`, page_slug: page.slug, ueberschrift: s.ueberschrift || seitenTitel, text: s.text,
  }));
}

/** knowledge/produkte.md: ein Absatz je Produkt, „**Name** (…): Text". */
/** Produktwissen: knowledge/produkte.md (Steckbriefe von Justus) zuerst, dann jede knowledge/produkte-*.md (Sortiment). */
export function ladeProduktwissen(ordner = 'knowledge') {
  if (!existsSync(ordner)) return '';
  const gehoert = (d) => d === 'produkte.md' || (d.startsWith('produkte-') && d.endsWith('.md'));
  const zuerst = (a, b) => (a === 'produkte.md' ? -1 : b === 'produkte.md' ? 1 : a.localeCompare(b));
  return readdirSync(ordner).filter(gehoert).sort(zuerst).map((d) => readFileSync(`${ordner}/${d}`, 'utf8').trim()).join('\n\n');
}
export function zerlegeWissen(md = ladeProduktwissen()) {
  return String(md).split(/\n\s*\n/).map((a) => a.trim()).filter((a) => a.startsWith('**')).map((a, i) => {
    const m = a.match(/^\*\*(.+?)\*\*\s*(.*)$/s);
    return { id: `${WISSEN_SLUG}#${i}`, page_slug: WISSEN_SLUG, ueberschrift: m ? m[1] : '', text: glatt(m ? `${m[1]} ${m[2]}` : a) };
  });
}

// ---- Suchen -----------------------------------------------------------------------------------
const STOPP = new Set(('der die das und oder ist sind ein eine einen einem einer mit für von aus bei zu zum zur im in an auf was wie wo wann warum wer welche welcher welches ich du er sie es wir ihr mein meine meinen meinem dein deine kann ich man mich mir dich dir sich nicht kein keine noch auch nur schon sehr mal denn dann also über unter vor nach dem den des am beim ins hat habe haben hast wird werden würde soll sollte muss müssen darf dürfen gibt geht mache machen').split(' '));
const SYNONYME = {
  keim: ['bakteri', 'biofilm', 'verkeim', 'legionell'], keimfrei: ['desinfi', 'bakteri'], bakteri: ['keim', 'biofilm'],
  sauber: ['reinig', 'desinfi', 'entkalk'], reinig: ['desinfi', 'clean'], desinfi: ['dexda', 'chlordioxid', 'reinig'],
  kalk: ['entkalk', 'kxpress'], entkalk: ['kxpress', 'kalk'], boiler: ['truma', 'entkalk'],
  konserv: ['silbernetz', 'silvertex', 'silberion'], silber: ['silbernetz', 'silvertex', 'silberion'], frisch: ['konserv'],
  winter: ['frost', 'winterfest', 'leer'], frost: ['winter'], filter: ['befuellfilter', 'aktivkohl'], geruch: ['aktivkohl', 'kxpress'],
  uv: ['uvc', 'bestrahl', 'physikal'], trinkbar: ['trinkwass', 'filter'], tank: ['frischwassertank'], stink: ['geruch', 'aktivkohl'],
  telefon: ['erreich', 'kontakt', 'anruf'], erreich: ['telefon', 'kontakt', 'mail'], oeffnungszeit: ['erreich', 'telefon'], adresse: ['kontakt', 'bunde'],
  reihenfolg: ['entkalk', 'desinfi', 'konserv', 'schritt'], schritt: ['reihenfolg'], preis: ['shop', 'kosten'], kost: ['shop', 'preis'],
};
const umlaute = (s) => s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
/** Grober deutscher Stamm: lange Endungen ab sechs, einzelne Buchstaben ab fünf Zeichen. Gilt für Frage und Stück gleich. */
const stamm = (w) => {
  let s = w;
  for (const e of ['ungen', 'ung', 'lich', 'isch', 'heit', 'keit', 'en', 'er', 'es', 'em']) {
    if (s.length > 5 && s.endsWith(e)) return s.slice(0, -e.length);
  }
  for (const e of ['e', 's', 'n']) if (s.length > 4 && s.endsWith(e)) return s.slice(0, -1);
  return s;
};
// Synonyme als Stämme, damit Frage, Stück und Synonym dieselbe Form haben.
const SYN = new Map(Object.entries(SYNONYME).map(([k, v]) => [stamm(k), v.map(stamm)]));
export function tokens(text) {
  return umlaute(String(text).toLowerCase()).replace(/[^a-z0-9]+/g, ' ').split(' ')
    .filter((w) => w.length >= 3 && !STOPP.has(w)).map(stamm);
}
/** Frage-Tokens plus Fachsynonyme (als Stämme). */
export function frageTokens(frage) {
  const basis = tokens(frage);
  const extra = basis.flatMap((t) => SYN.get(t) || []);
  return [...new Set([...basis, ...extra])];
}

/** Wortsuche mit Seltenheitsgewicht: seltene Treffer zählen mehr, Überschriften anderthalbfach. */
export function finde(frage, stuecke, n = 6) {
  if (!stuecke.length) return [];
  const gesucht = frageTokens(frage);
  if (!gesucht.length) return stuecke.length <= ALLES_BIS ? [...stuecke] : [];
  const indiziert = stuecke.map((s) => ({ s, text: new Set(tokens(s.text)), kopf: new Set(tokens(s.ueberschrift || '')) }));
  const df = new Map();
  for (const t of gesucht) df.set(t, indiziert.filter((z) => z.text.has(t) || z.kopf.has(t)).length);
  const gewichtet = indiziert.map((z) => {
    let score = 0;
    for (const t of gesucht) {
      const idf = Math.log(1 + indiziert.length / (1 + (df.get(t) || 0)));
      if (z.kopf.has(t)) score += idf * 1.5;
      else if (z.text.has(t)) score += idf;
    }
    return { ...z.s, score };
  }).sort((a, b) => b.score - a.score);
  if (stuecke.length <= ALLES_BIS) return gewichtet;           // kleiner Bestand: alles, Relevantes zuerst
  return gewichtet.filter((z) => z.score > 0).slice(0, n);
}

// ---- Bestand ----------------------------------------------------------------------------------
const jetzt = () => new Date().toISOString();

/** Alte Stücke einer Seite löschen, dann neu zerlegen — in dieser Reihenfolge, in einem Vorgang. */
export async function indexiereSeite(page) {
  await query('DELETE FROM chunks WHERE page_slug = $1', [page.slug]);
  if (page.status !== 'published' || Number(page.chat_excluded) === 1) return 0;
  const stuecke = zerlege(page);
  for (const s of stuecke) {
    await query('INSERT INTO chunks (id, page_slug, ueberschrift, text, updated_at) VALUES ($1, $2, $3, $4, $5)', [s.id, s.page_slug, s.ueberschrift, s.text, jetzt()]);
  }
  return stuecke.length;
}

export async function entferneSeite(slug) { await query('DELETE FROM chunks WHERE page_slug = $1', [slug]); }

/** Alles neu: jede veröffentlichte, nicht ausgeschlossene Seite plus die geprüften Produktdaten. */
export async function indexiereAlles() {
  await query('DELETE FROM chunks', []);
  let n = 0;
  for (const p of await query('SELECT * FROM pages WHERE status = $1', ['published'])) n += await indexiereSeite(p);
  for (const s of zerlegeWissen()) {
    await query('INSERT INTO chunks (id, page_slug, ueberschrift, text, updated_at) VALUES ($1, $2, $3, $4, $5)', [s.id, s.page_slug, s.ueberschrift, s.text, jetzt()]);
    n += 1;
  }
  return n;
}

export async function indexiereWennLeer() {
  const z = await queryOne('SELECT COUNT(*) AS n FROM chunks');
  if (Number(z?.n || 0) > 0) return 0;
  return indexiereAlles();
}

export async function ladeStuecke() { return query('SELECT id, page_slug, ueberschrift, text FROM chunks', []); }

// ---- Der Auftrag -----------------------------------------------------------------------------
const stemple = (text, facts) => String(text).replace(/\{\{facts\.([\w.]+)\}\}/g, (_, pfad) => {
  const w = pfad.split('.').reduce((o, k) => (o ?? {})[k], facts);
  return w == null || w === '' ? '[…]' : String(w);
});

export function formatiereAuszuege(stuecke, facts) {
  return stuecke.map((s) => `[${s.page_slug}] ${s.ueberschrift ? `${stemple(s.ueberschrift, facts)}: ` : ''}${stemple(s.text, facts)}`).join('\n\n');
}

/**
 * System: Rolle, Regeln, Sperrliste, Stimme — stabil, damit der Zwischenspeicher greift. Die Auszüge
 * stehen im Systemteil, wenn der Bestand klein ist (dann sind sie bei jeder Frage gleich), sonst
 * in der Nachricht. Der letzte Satz der Antwort ist die Quellenzeile; sie wird abgeschnitten und
 * als Chips gezeigt.
 */
export function baueChatAuftrag({ frage, verlauf = [], stuecke, facts = loadFacts(), config = {}, alles = false }) {
  const stimme = existsSync('knowledge/voice.md') ? readFileSync('knowledge/voice.md', 'utf8') : '';
  const regeln = existsSync('knowledge/compliance.md') ? readFileSync('knowledge/compliance.md', 'utf8') : '';
  const auszuege = formatiereAuszuege(stuecke, facts);
  const telefon = stemple('{{facts.telefon}}', facts);
  const zeiten = stemple('{{facts.oeffnungszeitenKurz}}', facts);
  let system = `Du bist ${config.name || 'Schorni'}, der Assistent auf der Website von Camping Schorni (Wasserhygiene im Wohnmobil). Du beantwortest Fragen AUSSCHLIESSLICH aus den Auszügen, die du bekommst.

Regeln, ohne Ausnahme:
- Steht die Antwort nicht in den Auszügen, sage das ehrlich in einem Satz und nenne den nächstbesten Weg: die Beratung am Telefon (${telefon}, ${zeiten}) oder die Kontaktseite (/kontakt/). Rate nie.
- Nenne nie einen Preis, einen Termin oder eine Zahl, die nicht wörtlich in einem Auszug steht. Preise gibt es nur im Shop.
- Nenne nie eine Wirkung, Standzeit oder Reichweite, die nicht wörtlich in einem Auszug steht.
- Diese Formulierungen sagst du nie, in keiner Form: ${STOPP_PHRASEN.join(' · ')}. Auch die Wörter ${VERBOTENE_WOERTER.join(', ')} kommen nie vor.
- Silber darf im Produktnamen und als sachliche Angabe vorkommen, nie als Verkaufsargument. KXpress entkalkt, er desinfiziert nicht. Ein Filter macht Wasser nicht trinkbar.
- Du gibst keine medizinischen oder rechtlichen Auskünfte. Bei Einbau, Sondertanks und allem, was Augenmaß braucht, verweist du auf die Beratung am Telefon.
- Antworte auf Deutsch, in der Du-Form, kurz: höchstens etwa 120 Wörter, ein bis zwei Absätze oder eine kurze Liste mit Spiegelstrichen. Fett nur für Produktnamen (**so**). Kein HTML.
- Schließe IMMER mit einer eigenen letzten Zeile ab: "QUELLEN: " gefolgt von den Kennungen in eckigen Klammern der Auszüge, aus denen du geantwortet hast, durch Komma getrennt (zum Beispiel "QUELLEN: wasser-ratgeber, wissen/produkte"). Hast du aus keinem Auszug geantwortet, schreibe "QUELLEN: keine".

Stimme (so klingt das Haus):
${stimme}

Compliance (verbindlich):
${regeln}`;
  if (alles) system += `\n\nAUSZÜGE (der gesamte Bestand der Website):\n${auszuege}`;
  const messages = [];
  for (const v of verlauf.slice(-6)) {
    if (v && (v.rolle === 'user' || v.rolle === 'assistant') && typeof v.text === 'string' && v.text.trim()) {
      messages.push({ role: v.rolle, content: v.text.slice(0, 600) });
    }
  }
  if (messages.length && messages[0].role !== 'user') messages.shift();
  const letzte = alles ? frage : `AUSZÜGE:\n${auszuege || '(keine passenden Auszüge gefunden)'}\n\nFRAGE: ${frage}`;
  if (messages.length && messages[messages.length - 1].role === 'user') messages.pop();
  messages.push({ role: 'user', content: letzte });
  return { system, messages };
}

// ---- Antwort prüfen --------------------------------------------------------------------------
/** Trennt die Quellenzeile ab und prüft die Kennungen gegen die mitgegebenen Auszüge. */
export function parseAntwort(text, stuecke) {
  const roh = String(text || '');
  const m = roh.match(/\n?\s*QUELLEN:\s*(.*)\s*$/i);
  const antwort = (m ? roh.slice(0, m.index) : roh).trim();
  const bekannt = new Set(stuecke.map((s) => s.page_slug));
  const genannt = m ? m[1].split(/[,\s]+/).map((s) => s.replace(/^\[|\]$/g, '').trim()).filter(Boolean) : [];
  const quellen = [...new Set(genannt.filter((s) => bekannt.has(s)))];
  const gewusst = !(m && /^keine\b/i.test(m[1].trim())) && antwort.length > 0;
  return { antwort, quellen, gewusst };
}

/** Dieselbe Sperrliste wie im Generator, hier als harte Bremse: eine verbotene Antwort wird ersetzt. */
export function pruefeAntwort(antwort, facts = loadFacts()) {
  const klein = String(antwort).toLowerCase();
  const verstoss = STOPP_PHRASEN.find((p) => klein.includes(p)) || VERBOTENE_WOERTER.find((w) => new RegExp(`\\b${w}`, 'i').test(antwort))
    || (/\d\s?€|€\s?\d|\beur\b|\d\s?euro\b/i.test(antwort) ? 'Preis' : null);
  if (verstoss) {
    return {
      antwort: `Dazu kann ich hier nichts Verlässliches sagen. Ruf am besten kurz an: ${stemple('{{facts.telefon}}', facts)}, ${stemple('{{facts.oeffnungszeitenKurz}}', facts)}. Dort bekommst du eine ehrliche Antwort.`,
      ersetzt: verstoss, gewusst: false,
    };
  }
  return { antwort: String(antwort), ersetzt: null, gewusst: true };
}

export const brauchtPflichthinweis = (antwort) => nenntBiozid(antwort);

// ---- Das Modell -------------------------------------------------------------------------------
export function assistentStatus(config) {
  const bereit = Boolean(config?.aktiv) && (schluesselVorhanden() || Boolean(process.env.GENERATOR_MODUL));
  return { bereit, modell: process.env.GENERATOR_MODUL ? `Modul ${process.env.GENERATOR_MODUL}` : (process.env.ASSISTENT_MODEL || STANDARD_CHAT_MODELL) };
}

/** Standard: Anthropic, als Strom. GENERATOR_MODUL ersetzt das Modell (Tests, anderes Modell) — wie beim Generator. */
export async function ladeChatModell() {
  if (process.env.GENERATOR_MODUL) {
    const { pathToFileURL } = await import('node:url');
    const { resolve } = await import('node:path');
    const m = await import(pathToFileURL(resolve(process.env.GENERATOR_MODUL)).href);
    return async ({ system, messages, onDelta }) => {
      const user = messages[messages.length - 1]?.content || '';
      const r = await m.default({ system, user, messages, onDelta });
      const text = typeof r === 'string' ? r : r?.text || '';
      if (!r?.gestreamt && onDelta) onDelta(text);
      return { text, verbrauch: r?.verbrauch || null };
    };
  }
  return anthropicChatModell;
}

export async function anthropicChatModell({ system, messages, onDelta }) {
  if (!schluesselVorhanden()) throw new Error('ANTHROPIC_API_KEY ist nicht gesetzt (.env). Ohne Schlüssel kein Assistent.');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic();
  try {
    const stream = client.beta.messages.stream({
      model: process.env.ASSISTENT_MODEL || STANDARD_CHAT_MODELL,
      max_tokens: 1024,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
    });
    let text = '';
    for await (const ev of stream) {
      if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') { text += ev.delta.text; if (onDelta) onDelta(ev.delta.text); }
    }
    const antwort = await stream.finalMessage();
    if (antwort.stop_reason === 'refusal') throw new Error('Das Modell hat die Anfrage abgelehnt');
    return { text, verbrauch: { modell: antwort.model, eingabe: antwort.usage?.input_tokens ?? 0, ausgabe: antwort.usage?.output_tokens ?? 0, cache: antwort.usage?.cache_read_input_tokens ?? 0, cacheSchreiben: antwort.usage?.cache_creation_input_tokens ?? 0 } };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error('Der Schlüssel wird nicht angenommen: ANTHROPIC_API_KEY in .env prüfen');
    if (err instanceof Anthropic.RateLimitError) throw new Error('Zu viele Anfragen beim Anbieter');
    if (err instanceof Anthropic.APIError) throw new Error(`API-Fehler ${err.status ?? ''}: ${err.message}`);
    throw err;
  }
}

// ---- Der Lauf ---------------------------------------------------------------------------------
/**
 * Eine Frage beantworten. onDelta bekommt die Antwort stückweise (ohne die Quellenzeile — die
 * letzten Zeichen werden zurückgehalten, bis klar ist, dass sie nicht zur Quellenzeile gehören).
 */
export async function antworte({ frage, verlauf = [], modell, config = {}, facts = loadFacts(), stuecke, onDelta }) {
  const alle = stuecke || await ladeStuecke();
  const alles = alle.length <= ALLES_BIS;
  const gefunden = finde(frage, alle, 6);
  const auftrag = baueChatAuftrag({ frage, verlauf, stuecke: gefunden, facts, config, alles });

  let gepuffert = '';
  let gesperrt = false;
  const weiter = (delta) => {
    if (gesperrt || !onDelta) return;
    gepuffert += delta;
    const i = gepuffert.search(/\n\s*QUELLEN:/i);
    if (i >= 0) { const rest = gepuffert.slice(0, i); if (rest) onDelta(rest); gepuffert = ''; gesperrt = true; return; }
    // Die letzten 12 Zeichen zurückhalten: sie könnten der Anfang von "\nQUELLEN:" sein.
    if (gepuffert.length > 12) { onDelta(gepuffert.slice(0, -12)); gepuffert = gepuffert.slice(-12); }
  };
  const roh = await modell({ system: auftrag.system, messages: auftrag.messages, onDelta: weiter });
  if (!gesperrt && gepuffert && onDelta) { const i = gepuffert.search(/\s*QUELLEN:/i); onDelta(i >= 0 ? gepuffert.slice(0, i) : gepuffert); }

  const geparst = parseAntwort(roh.text, gefunden);
  const geprueft = pruefeAntwort(geparst.antwort, facts);
  const antwort = geprueft.antwort;
  const gewusst = geparst.gewusst && geprueft.gewusst;
  const quellen = geprueft.ersetzt ? [] : geparst.quellen;
  return { antwort, quellen, gewusst, hinweis: brauchtPflichthinweis(antwort), ersetzt: geprueft.ersetzt, verbrauch: roh.verbrauch || null };
}

/** Quellen-Chips: Titel und Adresse je Slug — aus den Seiten, Wissen ohne Link. */
export async function quellenChips(slugs) {
  const out = [];
  for (const slug of slugs) {
    if (slug === WISSEN_SLUG) { out.push({ slug, titel: WISSEN_TITEL, href: null }); continue; }
    const p = await queryOne('SELECT slug, title FROM pages WHERE slug = $1 AND status = $2', [slug, 'published']);
    if (p) out.push({ slug, titel: p.title, href: slug === 'start' ? '/' : `/${slug}/` });
  }
  return out;
}

export async function protokolliere({ frage, antwort, quellen, gewusst }) {
  await query('INSERT INTO chat_log (id, frage, antwort, quellen, gewusst, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [randomUUID(), String(frage).slice(0, 500), String(antwort).slice(0, 2000), JSON.stringify(quellen), gewusst ? 1 : 0, jetzt()]);
}

/** Speicherfrist (Datenschutz): Protokolleinträge älter als zwölf Monate werden gelöscht. */
export async function raeumeProtokollAuf(tage = 365) {
  const grenze = new Date(Date.now() - tage * 86400000).toISOString();
  await query('DELETE FROM chat_log WHERE created_at < $1', [grenze]);
}

export async function fragenHeute() {
  const heute = jetzt().slice(0, 10);
  const z = await queryOne('SELECT COUNT(*) AS n FROM chat_log WHERE created_at >= $1', [heute]);
  return Number(z?.n || 0);
}
