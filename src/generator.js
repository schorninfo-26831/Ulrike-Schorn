/**
 * Stufe 4 — die KI als Motor.
 *
 * Der Generator bekommt den Inhalt (Notizen, Diktat, Stichworte), das Schema der erlaubten
 * Bausteine, die Goldreferenz und die Stimme (knowledge/) — und liefert ausschließlich JSON
 * gegen den Vertrag des Seitentyps. Drei Regeln, hart durchgesetzt:
 *   1. Vertrag: validateContent + pruefeBloecke. Scheitert das, gibt es kein Ergebnis.
 *   2. Fakten: der Auftrag verbietet Zahlen; Telefon, Anschrift & Co. nur als {{facts.pfad}}.
 *      Das Tor im Renderer fängt den Rest (fehlender Wert → sichtbar […]).
 *   3. Status 'generated', nie 'published'. Ein Mensch entscheidet.
 *
 * Das Modell ist eine austauschbare Funktion ({ system, user }) → { text, verbrauch }. So laufen
 * die Tests ohne Schlüssel, und ein anderes Modell ist ein anderes Modul (GENERATOR_MODUL).
 * Die Goldreferenz geht als JSON hinein (die Goldseite aus content/), nicht als HTML — P1.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { jsonrepair } from 'jsonrepair';
import { getType, listTypes, validateContent } from './archetypes.js';
import { blocks, pruefeBloecke } from './blocks/index.js';
import { loadFacts } from './config.js';

export const STANDARD_MODELL = 'claude-opus-5';
export const VERBOTENE_WOERTER = ['eintauchen', 'entdecken', 'enthüllen', 'umarmen'];
/** Nennt ein Text eines dieser Produkte, ist die Seite Werbung für ein Biozid (Art. 72). */
export const BIOZIDE = ['DEXDA', 'Silbernetz', 'Silvertex'];
/** Gesperrt laut Compliance — als Hinweis für den Menschen, der die Seite liest. */
export const STOPP_PHRASEN = [
  'natürliche wasserkonservierung', '100 % keimfrei', '100% keimfrei', 'alle keime', 'garantiert keimfrei',
  'keimfreies wasser', 'macht wasser trinkbar', 'unbedenklich', 'ungiftig', 'unschädlich', 'naturbelassen',
  'umweltfreundlich', 'tierfreundlich', 'niedrigem risiko', 'schützt vor krankheit', 'verhindert infektion',
  'macht gesund', 'krankheitserreger', 'silbertechnologie', 'silberkraft', 'natürliches silber', 'mit silber gegen',
];
/** Diese Bausteine tragen keinen Modelltext: ihre Vorgaben (aus den Fakten) gelten immer. */
const STRUKTUR = new Set(['nav', 'footer', 'hinweis']);

// ---- Eingaben ---------------------------------------------------------------------------------
/** Alles aus knowledge/, voice.md zuerst — die Stimme kommt vor den Regeln. */
export function ladeWissen(ordner = 'knowledge') {
  if (!existsSync(ordner)) return '';
  const reihenfolge = (a, b) => (a === 'voice.md' ? -1 : b === 'voice.md' ? 1 : a.localeCompare(b));
  return readdirSync(ordner).filter((d) => d.endsWith('.md')).sort(reihenfolge)
    .map((d) => readFileSync(`${ordner}/${d}`, 'utf8').trim()).join('\n\n');
}

/** Fakten-Pfade ohne Werte: das Modell soll Platzhalter setzen, keine Zahlen abschreiben. */
export function faktenPfade(facts, praefix = '') {
  return Object.entries(facts || {}).filter(([k]) => !k.startsWith('_')).flatMap(([k, v]) =>
    (v && typeof v === 'object' && !Array.isArray(v) ? faktenPfade(v, `${praefix}${k}.`) : [`${praefix}${k}`]));
}

/** Die erlaubten Bausteine des Typs mit ihren Feldern, lesbar für das Modell. */
export function beschreibeBausteine(typ) {
  const erlaubt = typ.schema?.allowedBlocks?.length ? typ.schema.allowedBlocks : Object.keys(blocks);
  const pflicht = new Set(typ.schema?.requiredBlocks || []);
  return erlaubt.filter((n) => blocks[n]).map((name) => {
    const b = blocks[name];
    const felder = Object.entries(b.schema).map(([k, f]) => {
      let vorgabe = '';
      if (Array.isArray(f.default) && f.default.length) vorgabe = ' [Vorgabe vorhanden: data leer lassen, dann gilt sie]';
      else if (f.default) vorgabe = ` [Vorgabe: ${JSON.stringify(f.default)}]`;
      const liste = f.type === 'list' && f.felder
        ? ` — Liste von Objekten mit ${Object.entries(f.felder).map(([n, t]) => `${n} (${t})`).join(', ')}` : '';
      const wahl = f.type === 'select'
        ? ` — genau einer von: ${(f.optionen === 'seitentypen' ? listTypes().map((t) => t.name) : (f.optionen || []).map((o) => (typeof o === 'string' ? o : o.value))).join(' | ')}` : '';
      return `    ${k} · ${f.type}${liste}${wahl}: ${f.label}${vorgabe}`;
    }).join('\n');
    return `- "${name}" (${b.label})${pflicht.has(name) ? ' — Pflicht' : ''}\n${felder}`;
  }).join('\n');
}

/** Die Goldreferenz als JSON: die erste Seite aus content/, die diesen Typ zeigt. */
export function ladeGoldreferenz(typName, ordner = 'content') {
  if (!existsSync(ordner)) return null;
  for (const datei of readdirSync(ordner).filter((d) => d.endsWith('.json') && !d.startsWith('_')).sort()) {
    try {
      const seite = JSON.parse(readFileSync(`${ordner}/${datei}`, 'utf8'));
      if (seite.page_type === typName) {
        return { title: seite.title, description: seite.description, blocks: seite.content?.blocks || [] };
      }
    } catch { /* eine kaputte Datei ist kein Grund, nicht zu generieren */ }
  }
  return null;
}

/** Der Auftrag: Systemteil (stabil, cachebar) und Nutzerteil (die Quelle). Reine Funktion. */
export function baueAuftrag({ typ, quelle, titel = '', facts = loadFacts(), wissen = ladeWissen(), gold = ladeGoldreferenz(typ.name) }) {
  const anweisungsdatei = `page-types/${typ.name}/prompt.md`;
  const anweisung = existsSync(anweisungsdatei) ? readFileSync(anweisungsdatei, 'utf8').trim() : (typ.beschreibung || '');
  const system = `Du schreibst Inhalte für die Website von Camping Schorni, eine Inhaltsseite neben dem Shop.
Du lieferst ausschließlich ein JSON-Objekt: kein HTML, kein Markdown-Zaun, kein Wort davor oder danach.

## Form der Antwort
{
  "title": "Seitentitel (Browser-Titel, ohne Zusatz)",
  "description": "Ein bis zwei Sätze für Suchmaschinen und beim Teilen, ohne Zahlen",
  "blocks": [ { "type": "<bausteinname>", "data": { ...felder... } } ]
}

## Regeln ohne Ausnahme
1. Nur die unten aufgeführten Bausteine, nur deren Felder. Die Pflichtbausteine kommen vor: "nav" als erster, "footer" als letzter Baustein, beide mit leerem data {} (ihre Vorgaben gelten).
2. Keine Zahlen aus deinem Kopf. Telefon, Anschrift, E-Mail, Öffnungszeiten, Gründungsjahr und USt-IdNr. stehen ausschließlich als Platzhalter {{facts.pfad}} im Text (Liste unten). Keine Preise, keine Prozente, keine Reichweiten oder Standzeiten außer den freigegebenen Formulierungen der Compliance.
3. Bilder wählt der Mensch später im Cockpit: Bildfelder (image) leer lassen oder bei ihrer Vorgabe belassen. Der Baustein "bild" kommt nur vor, wenn die Quelle ein Bild ausdrücklich nennt, dann mit alt-Text.
4. Felder vom Typ longtext dürfen Absätze (Leerzeile), **fett** und [Linktext](Ziel) enthalten. Sonst kein Markdown, nie HTML.
5. Links intern als /slug/, in den Shop nur über {{facts.shopUrl}}/... (siehe Ziele). Jede Seite hat genau eine Handlung: zum passenden Produkt im Shop.
6. Alles Sachliche stammt aus der Quelle oder aus dem Wissen unten. Was dort fehlt, wird nicht erfunden; dann wird der Text kürzer.
7. Der Baustein "hinweis" (Pflichthinweis) steht mit leerem data {} auf jeder Seite, die ein Biozidprodukt nennt, direkt nach dem ersten Baustein, der es nennt.
8. Anrede Du. Die vier Wörter eintauchen, entdecken, enthüllen, umarmen kommen nie vor.

## Erlaubte Bausteine für den Seitentyp „${typ.label}"
${beschreibeBausteine(typ)}

## Verfügbare Fakten-Platzhalter
${faktenPfade(facts).map((p) => `{{facts.${p}}}`).join(' · ')}

## Wissen: Stimme, Compliance, Ziele
${wissen}

## Anweisung für diesen Seitentyp
${anweisung}

## Goldreferenz: so sieht ein fertiges Ergebnis für diesen Typ aus. Struktur übernehmen, Sätze nicht.
${gold ? JSON.stringify(gold, null, 2) : '(keine)'}`;

  const user = `Seitentyp: ${typ.name} (${typ.label})
Arbeitstitel: ${titel || '(offen, bitte vorschlagen)'}

Quelle (Notizen, Diktat, Stichworte):
"""
${String(quelle).trim()}
"""

Liefere jetzt das JSON-Objekt.`;
  return { system, user };
}

// ---- Antwort lesen ----------------------------------------------------------------------------
/**
 * Gehärteter Parser: säubern → JSON.parse → aus dem Text herausschneiden → reparieren (jsonrepair,
 * auch bei abgeschnittener Antwort). Ein Generator, der an einem Komma scheitert, wird nicht benutzt.
 */
export function parseJson(text) {
  const s = String(text ?? '').replace(/^﻿/, '').trim()
    .replace(/^```[a-z]*\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const a = s.indexOf('{');
  const z = s.lastIndexOf('}');
  const kandidaten = [s];
  if (a >= 0 && z > a) kandidaten.push(s.slice(a, z + 1));
  if (a >= 0) kandidaten.push(s.slice(a)); // abgeschnitten: offene Klammern schließt jsonrepair
  // Nur ein Objekt zählt: aus Prosa macht jsonrepair sonst brav einen JSON-String.
  const objekt = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : undefined);
  for (const k of kandidaten) { try { const v = objekt(JSON.parse(k)); if (v) return v; } catch { /* nächster Versuch */ } }
  for (const k of kandidaten) { try { const v = objekt(JSON.parse(jsonrepair(k))); if (v) return v; } catch { /* nächster Versuch */ } }
  throw new Error('Die Antwort des Modells ist kein lesbares JSON');
}

// ---- Bereinigen und prüfen --------------------------------------------------------------------
const alsText = (v) => (typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '');
const alsBool = (v) => v === true || v === 'true' || v === 'ja';

function bereinigeFeld(def, wert) {
  if (def.type === 'bool') return alsBool(wert);
  if (def.type === 'list') {
    if (!Array.isArray(wert)) return undefined;
    const unter = def.felder || {};
    return wert.filter((e) => e && typeof e === 'object').map((e) => Object.fromEntries(
      Object.entries(unter).filter(([k]) => e[k] !== undefined)
        .map(([k, t]) => [k, t === 'bool' ? alsBool(e[k]) : alsText(e[k])])));
  }
  return alsText(wert);
}

export const nenntBiozid = (text) => BIOZIDE.some((p) => String(text).toLowerCase().includes(p.toLowerCase()));

/**
 * Bringt die Antwort in den Vertrag: nur bekannte Bausteine, nur Schema-Felder; nav zuerst, footer
 * zuletzt, hinweis nur einmal — alle drei mit leerem data (die Vorgaben aus den Fakten gelten);
 * Pflichthinweis nach dem ersten Baustein, der ein Biozid nennt. Nichts davon geschieht stumm:
 * jeder Eingriff steht in den Hinweisen.
 */
export function bereinige(typ, roh, arbeitstitel = '') {
  const hinweise = [];
  const eingang = Array.isArray(roh?.blocks) ? roh.blocks : Array.isArray(roh?.content?.blocks) ? roh.content.blocks : [];
  let hatNav = false;
  let hatFooter = false;
  let hatHinweis = false;
  const mitte = [];
  for (const b of eingang) {
    const name = typeof b?.type === 'string' ? b.type.trim().toLowerCase() : '';
    const def = blocks[name];
    if (!def) { hinweise.push(`Unbekannter Baustein „${name || '?'}" verworfen`); continue; }
    if (name === 'nav') { hatNav = true; continue; }
    if (name === 'footer') { hatFooter = true; continue; }
    if (name === 'hinweis') {
      if (hatHinweis) { hinweise.push('Doppelter Pflichthinweis entfernt'); continue; }
      hatHinweis = true; mitte.push({ type: 'hinweis', data: {} }); continue;
    }
    const daten = b.data && typeof b.data === 'object' && !Array.isArray(b.data) ? b.data : {};
    const data = {};
    for (const [k, feld] of Object.entries(def.schema)) {
      if (daten[k] === undefined || daten[k] === null) continue;
      const w = bereinigeFeld(feld, daten[k]);
      if (w !== undefined) data[k] = w;
    }
    const fremd = Object.keys(daten).filter((k) => !(k in def.schema));
    if (fremd.length) hinweise.push(`Baustein ${name}: unbekannte Felder verworfen (${fremd.join(', ')})`);
    mitte.push({ type: name, data });
  }

  const pflicht = typ.schema?.requiredBlocks || [];
  const erlaubt = typ.schema?.allowedBlocks || [];
  if (!hatNav && pflicht.includes('nav')) hinweise.push('Kopfzeile ergänzt');
  if (!hatFooter && pflicht.includes('footer')) hinweise.push('Fußzeile ergänzt');

  // Pflichthinweis (Art. 72): nach dem ersten Baustein, der ein Biozid nennt — wenn der Typ ihn kennt.
  const erster = mitte.findIndex((b) => b.type !== 'hinweis' && nenntBiozid(JSON.stringify(b.data)));
  if (erster >= 0 && !hatHinweis) {
    if (erlaubt.includes('hinweis')) { mitte.splice(erster + 1, 0, { type: 'hinweis', data: {} }); hinweise.push('Biozidprodukt genannt: Pflichthinweis ergänzt'); }
    else hinweise.push('Biozidprodukt genannt, aber dieser Seitentyp hat keinen Pflichthinweis-Baustein: Text ändern oder als Ratgeber anlegen');
  }

  const liste = [
    ...(hatNav || pflicht.includes('nav') ? [{ type: 'nav', data: {} }] : []),
    ...mitte,
    ...(hatFooter || pflicht.includes('footer') ? [{ type: 'footer', data: {} }] : []),
  ];
  const beschreibung = alsText(roh?.description).trim();
  return { title: alsText(roh?.title).trim() || arbeitstitel, description: beschreibung, inhalt: { blocks: liste }, hinweise };
}

/** Alle Textwerte eines Inhalts mit Fundstelle — für die Prüfungen. */
function texte(inhalt) {
  const out = [];
  (inhalt.blocks || []).forEach((b, i) => {
    const wo = `Baustein ${i + 1} (${blocks[b.type]?.label || b.type})`;
    const lauf = (wert, pfad) => {
      if (typeof wert === 'string') out.push({ ort: `${wo} · ${pfad}`, text: wert });
      else if (Array.isArray(wert)) wert.forEach((v, j) => lauf(v, `${pfad}[${j + 1}]`));
      else if (wert && typeof wert === 'object') Object.entries(wert).forEach(([k, v]) => lauf(v, pfad ? `${pfad}.${k}` : k));
    };
    lauf(b.data || {}, '');
  });
  return out;
}

/**
 * Der Vertrag (fehler → kein Ergebnis) und die weichen Prüfungen (hinweise → der Mensch liest sie):
 * verbotene Wörter, gesperrte Formulierungen, unbekannte Fakten, Zahlen, Preise, „ohne Chemie" neben Bioziden.
 */
export function pruefeErgebnis(typ, ergebnis, facts = loadFacts()) {
  const inhalt = ergebnis.inhalt;
  const vertrag = validateContent(typ.name, inhalt);
  const fehler = [...vertrag.fehler, ...(vertrag.ok ? pruefeBloecke(inhalt.blocks) : [])];
  const hinweise = [];
  const bekannt = new Set(faktenPfade(facts));
  const alle = [{ ort: 'Titel', text: ergebnis.title || '' }, { ort: 'Beschreibung', text: ergebnis.description || '' }, ...texte(inhalt)];
  for (const { ort, text } of alle) {
    const klein = text.toLowerCase();
    for (const w of VERBOTENE_WOERTER) if (new RegExp(`\\b${w}`, 'i').test(text)) hinweise.push(`Verbotenes Wort „${w}" in ${ort}`);
    for (const p of STOPP_PHRASEN) if (klein.includes(p)) hinweise.push(`Gesperrte Formulierung „${p}" in ${ort}`);
    for (const m of text.matchAll(/\{\{facts\.([\w.]+)\}\}/g)) {
      if (!bekannt.has(m[1])) hinweise.push(`Unbekannter Fakt {{facts.${m[1]}}} in ${ort}: erscheint auf der Seite als […]`);
    }
    // Platzhalter, Link-Ziele und eine Schrittnummer am Anfang („1 · Entkalken") zählen nicht als Zahl.
    const ohne = text.replace(/\{\{facts\.[\w.]+\}\}/g, '').replace(/\]\([^)]*\)/g, ']').replace(/^\s*\d{1,2}\s*[·.):]\s*/, '');
    const zahlen = [...new Set(ohne.match(/\d[\d.,:%]*/g) || [])];
    if (zahlen.length) hinweise.push(`Zahlen in ${ort}: ${zahlen.join(', ')} — nur aus Fakten oder freigegebenen Formulierungen`);
    if (/€|\beur\b|\bpreis/i.test(text)) hinweise.push(`Preis oder Währung in ${ort}: Preise stehen nur im Shop`);
  }
  const gesamt = alle.map((t) => t.text).join('\n').toLowerCase();
  if (nenntBiozid(gesamt) && gesamt.includes('ohne chemie')) hinweise.push('„ohne Chemie" auf einer Seite mit Biozidprodukt: eines von beiden muss weg');
  return { ok: fehler.length === 0, fehler, hinweise };
}

// ---- Der Lauf ---------------------------------------------------------------------------------
export async function generiere({ typ, quelle, titel = '', modell = anthropicModell, facts = loadFacts() }) {
  const t = typeof typ === 'string' ? getType(typ) : typ;
  if (!t) throw new Error(`Unbekannter Seitentyp: ${typ}`);
  if (!String(quelle || '').trim()) throw new Error('Quelle fehlt: Notizen, Diktat oder Stichworte');
  const auftrag = baueAuftrag({ typ: t, quelle, titel, facts });
  const antwort = await modell(auftrag);
  const text = typeof antwort === 'string' ? antwort : antwort?.text;
  if (!String(text || '').trim()) throw new Error('Das Modell hat nichts geliefert');
  const ergebnis = bereinige(t, parseJson(text), titel);
  const pruefung = pruefeErgebnis(t, ergebnis, facts);
  if (!pruefung.ok) throw new Error(`Vertrag verletzt: ${pruefung.fehler.join(' · ')}`); // 1. Vertrag
  return {
    title: ergebnis.title,
    description: ergebnis.description,
    content: ergebnis.inhalt,
    status: 'generated', // 3. Ein Mensch entscheidet
    hinweise: [...ergebnis.hinweise, ...pruefung.hinweise],
    verbrauch: (typeof antwort === 'object' && antwort?.verbrauch) || null,
  };
}

// ---- Das Modell -------------------------------------------------------------------------------
export const schluesselVorhanden = () => Boolean(process.env.ANTHROPIC_API_KEY?.trim());

/** Fürs Cockpit: ist der Generator einsatzbereit, und womit? */
export function generatorStatus() {
  if (process.env.GENERATOR_MODUL) return { bereit: true, modell: `Modul ${process.env.GENERATOR_MODUL}` };
  return { bereit: schluesselVorhanden(), modell: process.env.ANTHROPIC_MODEL || STANDARD_MODELL };
}

/** Standard ist die Anthropic-API. GENERATOR_MODUL ersetzt sie durch ein eigenes Modul — für Tests oder ein anderes Modell. */
export async function ladeModell() {
  if (process.env.GENERATOR_MODUL) {
    const m = await import(pathToFileURL(resolve(process.env.GENERATOR_MODUL)).href);
    if (typeof m.default !== 'function') throw new Error('GENERATOR_MODUL muss eine Funktion als default exportieren');
    return m.default;
  }
  return anthropicModell;
}

/** Die Anthropic-API. Der Schlüssel kommt aus der Umgebung (.env), nie aus dem Code. */
export async function anthropicModell({ system, user }) {
  if (!schluesselVorhanden()) throw new Error('ANTHROPIC_API_KEY ist nicht gesetzt (.env). Ohne Schlüssel kein Generator.');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic();
  try {
    // Streaming, damit eine lange Antwort in keinen Timeout läuft; finalMessage() sammelt sie ein.
    // Der Systemteil ist stabil und wird zwischengespeichert: mehrere Läufe nacheinander kosten weniger.
    const stream = client.beta.messages.stream({
      model: process.env.ANTHROPIC_MODEL || STANDARD_MODELL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: user }],
    });
    const antwort = await stream.finalMessage();
    if (antwort.stop_reason === 'refusal') throw new Error('Das Modell hat die Anfrage abgelehnt');
    if (antwort.stop_reason === 'max_tokens') throw new Error('Die Antwort wurde abgeschnitten: Quelle kürzen oder die Seite teilen');
    const text = antwort.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return {
      text,
      verbrauch: {
        modell: antwort.model,
        eingabe: antwort.usage?.input_tokens ?? 0,
        ausgabe: antwort.usage?.output_tokens ?? 0,
        cache: antwort.usage?.cache_read_input_tokens ?? 0,
        cacheSchreiben: antwort.usage?.cache_creation_input_tokens ?? 0,
      },
    };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error('Der Schlüssel wird nicht angenommen: ANTHROPIC_API_KEY in .env prüfen');
    if (err instanceof Anthropic.RateLimitError) throw new Error('Zu viele Anfragen beim Anbieter: kurz warten, dann erneut');
    if (err instanceof Anthropic.BadRequestError) throw new Error(`Die API hat die Anfrage abgelehnt: ${err.message}`);
    if (err instanceof Anthropic.APIError) throw new Error(`API-Fehler ${err.status ?? ''}: ${err.message}`);
    throw err;
  }
}
