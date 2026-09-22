// Stufe 6 — Erweitern. Läuft ohne Datenbank: der Bestand kommt als Daten herein (P3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/renderer.js';
import { getType, validateContent } from '../src/archetypes.js';
import { blocks } from '../src/blocks/index.js';
import { sortiereBestand } from '../src/blocks/liste.js';
import { baueAuftrag, bereinige } from '../src/generator.js';
import { loadFacts } from '../src/config.js';

const bestand = [
  { slug: 'wasser-ratgeber', page_type: 'ratgeber', status: 'published', title: 'Wasser-Ratgeber', description: 'Vier Handgriffe.', updated_at: '2026-09-21T10:00:00Z' },
  { slug: 'winterfest', page_type: 'ratgeber', status: 'published', title: 'Winterfest machen', description: 'Leer, sauber, trocken.', og_image: '/uploads/w.png', updated_at: '2026-09-22T10:00:00Z' },
  { slug: 'ratgeber', page_type: 'uebersicht', status: 'published', title: 'Ratgeber', description: '', updated_at: '2026-09-22T11:00:00Z' },
  { slug: 'kontakt', page_type: 'seite', status: 'published', title: 'Kontakt', description: '', updated_at: '2026-09-20T10:00:00Z' },
];
const seite = (data, slug = 'ratgeber') => ({ title: 'T', slug, status: 'published', content_json: { blocks: [{ type: 'liste', data }] } });

test('Übersicht: filtert nach Typ, lässt die eigene Seite weg, neueste zuerst, Bild nur wenn da', () => {
  const out = renderPage(seite({ typ: 'ratgeber', titel: 'Kapitel', linkText: 'Kapitel lesen' }), { dynamicData: { liste: { seiten: bestand, eigenerSlug: 'ratgeber' } } });
  assert.ok(out.includes('href="/wasser-ratgeber/"') && out.includes('href="/winterfest/"'));
  assert.ok(!out.includes('href="/kontakt/"') && !out.includes('href="/ratgeber/"'));
  assert.ok(out.indexOf('Winterfest machen') < out.indexOf('Wasser-Ratgeber'), 'neueste zuerst');
  assert.ok(out.includes('Kapitel lesen &rarr;') && out.includes('src="/uploads/w.png"'));
  assert.equal((out.match(/liste__bild/g) || []).length, 2, 'CSS-Klasse einmal im Stil, einmal am Bild');
});

test('Übersicht: nach Titel sortiert, leerer Bestand zeigt den Leer-Text, ohne Bestand kein Absturz', () => {
  assert.deepEqual(sortiereBestand(bestand.filter((s) => s.page_type === 'ratgeber'), 'titel').map((s) => s.slug), ['wasser-ratgeber', 'winterfest']);
  const leer = renderPage(seite({ typ: 'seite', leer: 'Noch nichts da.' }), { dynamicData: { liste: { seiten: [], eigenerSlug: 'x' } } });
  assert.ok(leer.includes('<p class="liste__leer">Noch nichts da.</p>') && !leer.includes('class="liste__grid"'));
  const ohne = renderPage(seite({ typ: 'ratgeber' }));
  assert.ok(ohne.includes('Hier entsteht gerade etwas'));
});

test('Neuer Seitentyp ist ein Ordner: uebersicht ist da, sein Vertrag verlangt die Liste', () => {
  const typ = getType('uebersicht');
  assert.ok(typ && typ.label === 'Übersicht');
  assert.equal(validateContent('uebersicht', { blocks: [{ type: 'nav', data: {} }, { type: 'hero', data: {} }, { type: 'footer', data: {} }] }).ok, false);
  assert.equal(validateContent('uebersicht', { blocks: [{ type: 'nav', data: {} }, { type: 'hero', data: {} }, { type: 'liste', data: { typ: 'ratgeber' } }, { type: 'footer', data: {} }] }).ok, true);
  assert.equal(validateContent('uebersicht', { blocks: [{ type: 'nav', data: {} }, { type: 'hero', data: {} }, { type: 'liste', data: {} }, { type: 'cards', data: {} }, { type: 'footer', data: {} }] }).ok, false, 'Karten sind hier nicht erlaubt');
});

test('Auswahlfelder: im Schema, im Auftrag als Aufzählung, beim Bereinigen als Text', () => {
  assert.equal(blocks.liste.schema.typ.type, 'select');
  assert.equal(blocks.bild.schema.breite.type, 'select');
  const { system } = baueAuftrag({ typ: getType('uebersicht'), quelle: 'x', facts: loadFacts() });
  assert.ok(system.includes('typ · select — genau einer von: home | ratgeber | recht | seite | uebersicht'));
  assert.ok(system.includes('sortierung · select — genau einer von: neueste | titel'));
  const e = bereinige(getType('uebersicht'), { blocks: [{ type: 'hero', data: { titel: 'x' } }, { type: 'liste', data: { typ: 'ratgeber', sortierung: 'titel', seiten: [{ slug: 'erfunden' }] } }] });
  assert.deepEqual(e.inhalt.blocks[2].data, { typ: 'ratgeber', sortierung: 'titel' }, 'seiten kommt aus dem Bestand, nie vom Modell');
});

test('Kopfzeile: zweite Menüebene als Aufklappmenü, ohne Kinder kein Aufklappmenü', () => {
  const baum = [{ label: 'Ratgeber', href: '/ratgeber/', kinder: [{ label: 'Wasser-Ratgeber', href: '/wasser-ratgeber/' }] }, { label: 'Kontakt', href: '/kontakt/', kinder: [] }];
  const out = renderPage({ title: 'T', status: 'published', content_json: { blocks: [{ type: 'nav', data: {} }] } }, { dynamicData: { nav: { baum } } });
  assert.ok(out.includes('class="nav__punkt nav__punkt--unter"><a href="/ratgeber/">Ratgeber</a><ul class="nav__unter"><li><a href="/wasser-ratgeber/">Wasser-Ratgeber</a></li></ul>'));
  assert.ok(out.includes('<li class="nav__punkt"><a href="/kontakt/">Kontakt</a></li>'));
});
