// Stufe 7 — der Assistent, ohne Datenbank, ohne Netz, ohne Schlüssel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  zerlege, zerlegeWissen, tokens, frageTokens, finde, baueChatAuftrag, parseAntwort, pruefeAntwort,
  brauchtPflichthinweis, antworte, ALLES_BIS,
} from '../src/assistent.js';
import { loadFacts } from '../src/config.js';

const facts = loadFacts();
const ratgeber = JSON.parse(readFileSync('content/wasser-ratgeber.json', 'utf8'));
const seite = { ...ratgeber, content_json: ratgeber.content };

test('Zerlegen: Karten werden je Eintrag ein Stück, nav/footer/hinweis fallen weg, Markdown ist glatt, Slug hängt dran', () => {
  const st = zerlege(seite);
  assert.ok(st.length >= 6, 'zu wenige Stücke: ' + st.length);
  assert.ok(st.every((s) => s.page_slug === 'wasser-ratgeber' && s.id.startsWith('wasser-ratgeber#')));
  const kxpress = st.find((s) => s.ueberschrift === '1 · Entkalken');
  assert.ok(kxpress && kxpress.text.includes('KXpress entkalkt') && !kxpress.text.includes('**'));
  assert.ok(!st.some((s) => /Biozidprodukte vorsichtig/.test(s.text)), 'der Pflichthinweis ist kein Wissen');
  assert.ok(!st.some((s) => /collections/.test(s.text)), 'Link-Ziele sind kein Wissen');
  assert.ok(st.some((s) => s.text.includes('{{facts.telefon}}')), 'Platzhalter bleiben bis zum Antworten');
});

test('Wissen: knowledge/produkte.md wird je Produktabsatz ein Stück', () => {
  const w = zerlegeWissen();
  assert.ok(w.length >= 8);
  assert.ok(w.every((s) => s.page_slug === 'wissen/produkte'));
  const dexda = w.find((s) => s.ueberschrift === 'DEXDA Clean');
  assert.ok(dexda && dexda.text.includes('Truma Boiler'));
  assert.deepEqual(zerlegeWissen('kein Produkt hier'), []);
});

test('Suche: Stämme, Umlaute, Synonyme, Seltenheit — Truma findet DEXDA Clean zuerst, Kalk findet KXpress', () => {
  assert.deepEqual(tokens('Verträgt mein Truma Boiler DEXDA Clean?'), ['vertraegt', 'truma', 'boil', 'dexda', 'clea'], 'Stämme, nicht Wörter — auf beiden Seiten gleich');
  assert.ok(frageTokens('Wie kriege ich den Kalk raus?').includes('kxpres'), 'Synonyme sind Stämme, wie die Stücke selbst');
  assert.ok(frageTokens('Sind danach alle Keime weg?').includes('biofilm'));
  const st = [...zerlege(seite), ...zerlegeWissen()];
  const gross = Array.from({ length: ALLES_BIS + 5 }, (_, i) => ({ id: `x#${i}`, page_slug: 'x', ueberschrift: '', text: `Füllstück Nummer ${i} über nichts Bestimmtes` }));
  const treffer = finde('Verträgt mein Truma Boiler DEXDA Clean?', [...st, ...gross], 6);
  assert.ok(treffer.length <= 6 && treffer.length > 0);
  assert.match(treffer[0].text, /Truma/);
  const kalk = finde('Wie kriege ich den Kalk aus dem Boiler?', [...st, ...gross], 3);
  assert.ok(kalk.some((t) => /KXpress/.test(t.text)));
  const klein = finde('irgendwas', st, 6);
  assert.equal(klein.length, st.length, 'kleiner Bestand: alles, Relevantes zuerst');
  assert.deepEqual(finde('x', [], 6), []);
});

test('Auftrag: Regeln, Sperrliste, Stimme, Compliance, gestempelte Auszüge, Quellenzeile, Verlauf begrenzt', () => {
  const st = zerlege(seite);
  const { system, messages } = baueChatAuftrag({ frage: 'Wie erreiche ich euch?', stuecke: st, facts, config: { name: 'Schorni' }, alles: true,
    verlauf: [{ rolle: 'assistant', text: 'x' }, { rolle: 'user', text: 'a' }, { rolle: 'assistant', text: 'b' }, { rolle: 'user', text: 'c' }] });
  assert.ok(system.includes('AUSSCHLIESSLICH') && system.includes('QUELLEN:') && system.includes('natürliche wasserkonservierung'));
  assert.ok(system.includes('Neun Schreibregeln') && system.includes('Pflichthinweis'));
  assert.ok(system.includes(facts.telefon) && !system.includes('{{facts.telefon}}'), 'Fakten sind gestempelt');
  assert.ok(system.includes('[wasser-ratgeber]'));
  assert.deepEqual(messages.map((m) => m.role), ['user', 'assistant', 'user']);
  assert.equal(messages[messages.length - 1].content, 'Wie erreiche ich euch?');
  const klein = baueChatAuftrag({ frage: 'F?', stuecke: st.slice(0, 2), facts, alles: false });
  assert.ok(!klein.system.includes('[wasser-ratgeber]') && klein.messages[0].content.includes('AUSZÜGE') && klein.messages[0].content.endsWith('FRAGE: F?'));
});

test('Antwort lesen: Quellenzeile abtrennen, nur bekannte Kennungen, „keine" heißt nicht gewusst', () => {
  const st = [{ page_slug: 'wasser-ratgeber' }, { page_slug: 'wissen/produkte' }];
  const a = parseAntwort('Ja, **DEXDA Clean** passt.\n\nQUELLEN: wasser-ratgeber, [wissen/produkte], erfunden', st);
  assert.equal(a.antwort, 'Ja, **DEXDA Clean** passt.');
  assert.deepEqual(a.quellen, ['wasser-ratgeber', 'wissen/produkte']);
  assert.equal(a.gewusst, true);
  const b = parseAntwort('Das steht hier nicht. Ruf an.\nQUELLEN: keine', st);
  assert.equal(b.gewusst, false); assert.deepEqual(b.quellen, []); assert.equal(b.antwort, 'Das steht hier nicht. Ruf an.');
  const c = parseAntwort('Ohne Quellenzeile.', st);
  assert.equal(c.antwort, 'Ohne Quellenzeile.'); assert.deepEqual(c.quellen, []); assert.equal(c.gewusst, true);
});

test('Antwort prüfen: Sperrliste, verbotene Wörter und Preise werden ersetzt; Biozid verlangt den Pflichthinweis', () => {
  const ok = pruefeAntwort('Erst entkalken, dann desinfizieren.', facts);
  assert.equal(ok.ersetzt, null);
  const s1 = pruefeAntwort('Danach ist dein Wasser 100 % keimfrei.', facts);
  assert.equal(s1.ersetzt, '100 % keimfrei'); assert.ok(s1.antwort.includes(facts.telefon)); assert.equal(s1.gewusst, false);
  assert.equal(pruefeAntwort('Entdecken Sie unser Sortiment.', facts).ersetzt, 'entdecken');
  assert.equal(pruefeAntwort('Das kostet 9,90 €.', facts).ersetzt, 'Preis');
  assert.equal(pruefeAntwort('Ungefähr 12 Euro.', facts).ersetzt, 'Preis');
  assert.equal(brauchtPflichthinweis('Nimm DEXDA Clean.'), true);
  assert.equal(brauchtPflichthinweis('Nimm KXpress zum Entkalken.'), false);
});

test('Der Lauf: Strom ohne Quellenzeile, Quellen und Pflichthinweis am Ende, Verstoß wird ersetzt', async () => {
  const st = [...zerlege(seite), ...zerlegeWissen()];
  const deltas = [];
  const modell = async ({ messages, onDelta }) => {
    const text = 'Ja, **DEXDA Clean** ist nachweislich auch für Truma Boiler geeignet.\n\nQUELLEN: wissen/produkte, wasser-ratgeber';
    for (const teil of text.match(/.{1,7}/gs)) onDelta(teil);
    return { text, verbrauch: { eingabe: 1, ausgabe: 2 } };
  };
  const e = await antworte({ frage: 'Verträgt mein Truma Boiler DEXDA Clean?', modell, stuecke: st, facts, config: {}, onDelta: (t) => deltas.push(t) });
  assert.equal(e.antwort, 'Ja, **DEXDA Clean** ist nachweislich auch für Truma Boiler geeignet.');
  assert.deepEqual(e.quellen, ['wissen/produkte', 'wasser-ratgeber']);
  assert.equal(e.hinweis, true); assert.equal(e.gewusst, true);
  assert.ok(!deltas.join('').includes('QUELLEN'), 'die Quellenzeile darf nie im Strom landen');
  assert.equal(deltas.join('').trim(), e.antwort);

  const boese = async ({ onDelta }) => { const t = 'Danach ist alles 100 % keimfrei.\nQUELLEN: wissen/produkte'; onDelta(t); return { text: t }; };
  const b = await antworte({ frage: 'Ist es dann keimfrei?', modell: boese, stuecke: st, facts, config: {} });
  assert.equal(b.ersetzt, '100 % keimfrei'); assert.deepEqual(b.quellen, []); assert.equal(b.gewusst, false); assert.ok(b.antwort.includes('Ruf am besten'));

  const nix = async () => ({ text: 'Das steht hier nicht. Ruf an: ' + facts.telefon + '.\nQUELLEN: keine' });
  const n = await antworte({ frage: 'Passt das in meinen Dethleffs?', modell: nix, stuecke: st, facts, config: {} });
  assert.equal(n.gewusst, false); assert.deepEqual(n.quellen, []); assert.equal(n.hinweis, false);
});
