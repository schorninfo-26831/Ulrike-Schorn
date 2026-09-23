// Läuft ohne Datenbank und ohne Schlüssel: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage, assistentStempel } from '../src/renderer.js';
import { validateContent } from '../src/archetypes.js';
import { loadFacts } from '../src/config.js';

const seite = (blocks, status = 'published') => ({ title: 'Test', status, content_json: { blocks } });

test('Modelltext wird escaped — kein Markup rutscht durch', () => {
  const out = renderPage(seite([{ type: 'hero', data: { titel: '<script>alert(1)</script>' } }]));
  assert.ok(out.includes('&lt;script&gt;'));
  assert.ok(!out.includes('<script>alert'));
});

test('Fakten-Tor: Wert wird gestempelt, fehlender Wert wird sichtbar', () => {
  const facts = loadFacts();
  const out = renderPage(seite([{ type: 'richtext', data: { text: 'Tel {{facts.telefon}} — {{facts.gibtEsNicht}}' } }]));
  assert.ok(out.includes(facts.telefon));
  assert.ok(out.includes('[…]'));
});

test('Link-Ziel aus den Fakten besteht die ziel()-Prüfung', () => {
  const out = renderPage(seite([{ type: 'cta', data: { label: 'Shop', href: '{{facts.shopUrl}}' } }]));
  assert.ok(out.includes('href="https://camping-schorni.de"'));
});

test('Fakten-Tor stempelt auch in Listen — Kartenlink aus den Fakten überlebt die ziel()-Prüfung', () => {
  const out = renderPage(seite([{ type: 'cards', data: { items: [
    { titel: 'A', text: 'x', label: 'Shop', href: '{{facts.shopUrl}}/collections/wasser' },
  ] } }]));
  assert.ok(out.includes('href="https://camping-schorni.de/collections/wasser"'));
  assert.ok(out.includes('class="card__link"'));
});

test('Gefährliche Ziele werden verworfen', () => {
  const out = renderPage(seite([{ type: 'hero', data: { titel: 'x', ctaLabel: 'Klick', ctaHref: 'javascript:alert(1)' } }]));
  assert.ok(!out.includes('javascript:'));
  assert.ok(!out.includes('class="hero__cta"')); // das CSS nennt die Klasse, das Element darf nicht existieren
});

test('Entwurf trägt noindex, Veröffentlichtes nicht', () => {
  assert.ok(renderPage(seite([], 'draft')).includes('noindex'));
  assert.ok(!renderPage(seite([], 'published')).includes('noindex'));
});

test('Karten: drei Einträge, Markdown-inline, Link nur mit sicherem Ziel', () => {
  const out = renderPage(seite([{ type: 'cards', data: { titel: 'T', items: [
    { titel: 'A', text: '**fett**', label: 'mehr', href: '/a/' },
    { titel: 'B', text: 'x', label: 'mehr', href: 'javascript:1' },
    { titel: 'C', text: 'y' },
  ] } }]));
  assert.equal((out.match(/<article class="card">/g) || []).length, 3);
  assert.ok(out.includes('<strong>fett</strong>'));
  assert.equal((out.match(/class="card__link"/g) || []).length, 1);
});

test('Tipp ohne Text rendert nichts', () => {
  const out = renderPage(seite([{ type: 'tipp', data: { text: '' } }]));
  assert.ok(!out.includes('class="tipp__blase"')); // CSS nennt die Klasse, das Element darf nicht existieren
});

test('Pflichthinweis kommt aus den Fakten und steht abgehoben', () => {
  const facts = loadFacts();
  const out = renderPage(seite([{ type: 'hinweis', data: {} }]));
  assert.ok(out.includes('class="hinweis__box"'));
  assert.ok(out.includes(facts.biozidPflichthinweis));
});

test('Rechtstext-Typ lässt keinen Handlungsaufruf zu', () => {
  assert.equal(validateContent('recht', { blocks: [{ type: 'nav' }, { type: 'hero' }, { type: 'richtext' }, { type: 'cta' }, { type: 'footer' }] }).ok, false);
  assert.equal(validateContent('recht', { blocks: [{ type: 'nav' }, { type: 'hero' }, { type: 'richtext' }, { type: 'footer' }] }).ok, true);
});

test('Vertrag: Pflichtbausteine und erlaubte Bausteine', () => {
  assert.equal(validateContent('home', { blocks: [{ type: 'nav' }, { type: 'hero' }, { type: 'footer' }] }).ok, true);
  assert.equal(validateContent('home', { blocks: [{ type: 'hero' }] }).ok, false);
  assert.equal(validateContent('home', { blocks: [{ type: 'nav' }, { type: 'hero' }, { type: 'footer' }, { type: 'karussell' }] }).ok, false);
  assert.equal(validateContent('gibtEsNicht', { blocks: [] }).ok, false);
});

test('Widget-Skript trägt einen Stempel aus seinem Inhalt, nicht die Motor-Version', () => {
  const stempel = assistentStempel();
  assert.match(stempel, /^[0-9a-f]{10}$/);
  const out = renderPage(seite([{ type: 'richtext', data: { text: 'Hallo' } }]));
  assert.ok(out.includes(`<script src="/assistent.js?v=${stempel}" defer></script>`));
});
