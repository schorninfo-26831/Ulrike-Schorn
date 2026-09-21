// Stufe 4 — der Generator, geprüft ohne Schlüssel und ohne Netz: das Modell ist eine Funktion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getType } from '../src/archetypes.js';
import { loadFacts } from '../src/config.js';
import {
  parseJson, baueAuftrag, bereinige, pruefeErgebnis, generiere, faktenPfade, ladeGoldreferenz, generatorStatus,
} from '../src/generator.js';

const facts = loadFacts();
const ratgeber = getType('ratgeber');

const seite = {
  title: 'Winterfest machen',
  description: 'So kommt dein Wassersystem durch den Winter.',
  blocks: [
    { type: 'nav', data: {} },
    { type: 'hero', data: { pill: 'Ratgeber', titel: 'Winterfest in drei Schritten', sub: 'Leer, sauber, trocken.', ctaLabel: 'Zum Sortiment', ctaHref: '{{facts.shopUrl}}/collections/wasser' } },
    { type: 'richtext', data: { titel: 'Vorher', text: 'Erst entkalken mit **KXpress**, dann mit DEXDA Clean desinfizieren.' } },
    { type: 'tipp', data: { text: 'Hähne offen lassen, dann friert nichts fest.' } },
    { type: 'cta', data: { titel: 'Bereit?', text: 'Ruf an: {{facts.telefon}}.', label: 'Zum Shop', href: '{{facts.shopUrl}}/collections/wasser' } },
    { type: 'footer', data: {} },
  ],
};

test('Parser: Markdown-Zaun, Text drumherum, fehlendes und überzähliges Komma, abgeschnitten', () => {
  assert.deepEqual(parseJson('```json\n{"a": 1}\n```'), { a: 1 });
  assert.deepEqual(parseJson('Hier ist dein JSON:\n{"a": [1, 2]}\nViel Erfolg!'), { a: [1, 2] });
  assert.deepEqual(parseJson('{"a": 1, "b": [1, 2,],}'), { a: 1, b: [1, 2] });
  assert.deepEqual(parseJson('{"a": 1 "b": 2}'), { a: 1, b: 2 });
  const abgeschnitten = parseJson('{"title": "x", "blocks": [{"type": "nav", "data": {}}, {"type": "hero", "data": {"titel": "Hallo');
  assert.equal(abgeschnitten.blocks[1].data.titel, 'Hallo');
  assert.throws(() => parseJson('kein json weit und breit'), /kein lesbares JSON/);
});

test('Auftrag: Schema, Fakten-Pfade ohne Werte, Stimme, Compliance, Goldreferenz und Quelle sind drin', () => {
  const { system, user } = baueAuftrag({ typ: ratgeber, quelle: 'Frostschutz, Tank leeren', titel: 'Winterfest', facts });
  for (const name of ratgeber.schema.allowedBlocks) assert.ok(system.includes(`"${name}"`), `Baustein ${name} fehlt im Auftrag`);
  assert.ok(!system.includes('"form"'), 'form ist im Ratgeber nicht erlaubt und darf nicht angeboten werden');
  assert.ok(system.includes('{{facts.telefon}}') && system.includes('{{facts.anschrift.plz}}'));
  assert.ok(!system.includes(facts.telefon), 'Faktenwerte gehören nicht in den Auftrag — nur Pfade');
  assert.ok(!system.includes('_hinweis'), 'interne Schlüssel bleiben draußen');
  assert.ok(system.includes('eintauchen') && system.includes('Pflichthinweis') && system.includes('Silbernetz Flex'));
  assert.ok(system.includes('"page_type"') === false && system.includes('Vier Handgriffe'), 'Goldreferenz als JSON, ohne Verwaltungsfelder');
  assert.ok(user.includes('Frostschutz, Tank leeren') && user.includes('Winterfest'));
  assert.deepEqual(ladeGoldreferenz('gibtEsNicht'), null);
  assert.ok(faktenPfade({ a: { b: '' }, _x: 1, c: [] }).join() === 'a.b,c');
});

test('Bereinigen: unbekannte Bausteine und Felder fliegen raus, nav/footer/hinweis werden strukturell, Pflichthinweis nach dem ersten Biozid', () => {
  const roh = {
    title: ' Winterfest ',
    blocks: [
      { type: 'hero', data: { titel: 'Hallo', unsinn: 'weg', bild: '' } },
      { type: 'faq', data: { frage: 'x' } },
      { type: 'richtext', data: { text: 'Mit DEXDA Clean.' } },
      { type: 'hinweis', data: { text: 'eigener Text, der nicht zählt' } },
      { type: 'hinweis', data: {} },
      { type: 'footer', data: { marke: 'Fremd' } },
      { type: 'nav', data: {} },
    ],
  };
  const e = bereinige(ratgeber, roh, 'Arbeitstitel');
  assert.equal(e.title, 'Winterfest');
  assert.deepEqual(e.inhalt.blocks.map((b) => b.type), ['nav', 'hero', 'richtext', 'hinweis', 'footer']);
  assert.deepEqual(e.inhalt.blocks[3].data, {}, 'Der Pflichtsatz kommt aus den Fakten, nie vom Modell');
  assert.deepEqual(e.inhalt.blocks[4].data, {});
  assert.equal('unsinn' in e.inhalt.blocks[1].data, false);
  assert.ok(e.hinweise.some((h) => h.includes('faq')) && e.hinweise.some((h) => h.includes('Doppelter Pflichthinweis')));

  const ohne = bereinige(ratgeber, { blocks: [{ type: 'hero', data: { titel: 'x' } }, { type: 'cards', data: { items: [{ titel: 'Silbernetz Flex', text: 'rein damit', extra: 1 }] } }] }, 'T');
  assert.deepEqual(ohne.inhalt.blocks.map((b) => b.type), ['nav', 'hero', 'cards', 'hinweis', 'footer']);
  assert.deepEqual(ohne.inhalt.blocks[2].data.items, [{ titel: 'Silbernetz Flex', text: 'rein damit' }]);
  assert.ok(ohne.hinweise.includes('Biozidprodukt genannt: Pflichthinweis ergänzt'));

  const home = bereinige(getType('home'), { blocks: [{ type: 'richtext', data: { text: 'DEXDA Clean' } }] });
  assert.ok(home.hinweise.some((h) => h.includes('keinen Pflichthinweis-Baustein')));
});

test('Prüfung: verbotene Wörter, gesperrte Formulierungen, unbekannte Fakten, Zahlen und Preise werden gemeldet, Vertrag bleibt hart', () => {
  const e = bereinige(ratgeber, {
    title: 'Entdecken',
    blocks: [
      { type: 'hero', data: { titel: 'Natürliche Wasserkonservierung für 9,90 €', sub: 'Ruf an: {{facts.telefonMobil}} oder 04959 1', ctaHref: '/x/' } },
      { type: 'richtext', data: { text: 'DEXDA Clean, ganz ohne Chemie.' } },
      { type: 'cards', data: { items: [{ titel: '1 · Entkalken', text: 'Bei 4 Grad ist Schluss.' }] } },
    ],
  });
  const p = pruefeErgebnis(ratgeber, e, facts);
  assert.equal(p.ok, true);
  const text = p.hinweise.join('\n');
  assert.match(text, /Verbotenes Wort „entdecken" in Titel/);
  assert.match(text, /Gesperrte Formulierung „natürliche wasserkonservierung"/);
  assert.match(text, /Unbekannter Fakt \{\{facts\.telefonMobil\}\}/);
  assert.match(text, /Zahlen in Baustein 2 \(Aufmacher\) · sub: 04959, 1/);
  assert.match(text, /Preis oder Währung/);
  assert.ok(!/items\[1\]\.titel/.test(text), 'Schrittnummer am Anfang ist keine Zahl im Sinne der Prüfung');
  assert.match(text, /items\[1\]\.text: 4/);
  assert.match(text, /ohne Chemie/);

  const kaputt = pruefeErgebnis(getType('recht'), bereinige(getType('recht'), { blocks: [{ type: 'cards', data: {} }] }), facts);
  assert.equal(kaputt.ok, false);
  assert.ok(kaputt.fehler.some((f) => f.includes('nicht erlaubt')) && kaputt.fehler.some((f) => f.includes('Pflicht-Baustein fehlt: hero')));
});

test('Generieren: Modell ist eine Funktion, Ergebnis ist generated und trägt Hinweise und Verbrauch', async () => {
  const gesehen = {};
  const modell = async ({ system, user }) => {
    gesehen.system = system; gesehen.user = user;
    return { text: 'Gern! Hier:\n```json\n' + JSON.stringify(seite) + '\n```\nFertig.', verbrauch: { eingabe: 10, ausgabe: 5 } };
  };
  const e = await generiere({ typ: 'ratgeber', quelle: 'Tank leeren, Hähne auf, KXpress vorher', titel: 'Winter', modell, facts });
  assert.equal(e.status, 'generated');
  assert.equal(e.title, 'Winterfest machen');
  assert.deepEqual(e.content.blocks.map((b) => b.type), ['nav', 'hero', 'richtext', 'hinweis', 'tipp', 'cta', 'footer']);
  assert.deepEqual(e.verbrauch, { eingabe: 10, ausgabe: 5 });
  assert.ok(e.hinweise.includes('Biozidprodukt genannt: Pflichthinweis ergänzt'));
  assert.ok(gesehen.user.includes('KXpress vorher') && gesehen.system.includes('Ratgeber'));

  await assert.rejects(generiere({ typ: 'recht', quelle: 'x', modell: async () => JSON.stringify({ blocks: [{ type: 'cards', data: {} }] }), facts }), /Vertrag verletzt/);
  await assert.rejects(generiere({ typ: 'ratgeber', quelle: '   ', modell, facts }), /Quelle fehlt/);
  await assert.rejects(generiere({ typ: 'nix', quelle: 'x', modell, facts }), /Unbekannter Seitentyp/);
  await assert.rejects(generiere({ typ: 'ratgeber', quelle: 'x', modell: async () => 'Ich kann das leider nicht.', facts }), /kein lesbares JSON/);
  await assert.rejects(generiere({ typ: 'ratgeber', quelle: 'x', modell: async () => JSON.stringify({ blocks: [{ type: 'hero', data: { titel: 'x' } }, { type: 'bild', data: { src: '/uploads/x.png', alt: '' } }] }), facts }), /Alternativtext/);
});

test('Ohne Schlüssel ist der Generator nicht bereit, und die Meldung sagt, wo er hingehört', async () => {
  const alt = { key: process.env.ANTHROPIC_API_KEY, modul: process.env.GENERATOR_MODUL };
  delete process.env.ANTHROPIC_API_KEY; delete process.env.GENERATOR_MODUL;
  assert.equal(generatorStatus().bereit, false);
  const { anthropicModell } = await import('../src/generator.js');
  await assert.rejects(anthropicModell({ system: 'x', user: 'y' }), /ANTHROPIC_API_KEY ist nicht gesetzt/);
  process.env.GENERATOR_MODUL = './irgendwas.js';
  assert.equal(generatorStatus().bereit, true);
  delete process.env.GENERATOR_MODUL;
  if (alt.key) process.env.ANTHROPIC_API_KEY = alt.key;
  if (alt.modul) process.env.GENERATOR_MODUL = alt.modul;
});
