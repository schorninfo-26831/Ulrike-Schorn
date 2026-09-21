// Reine Helfer des Cockpits — ohne Datenbank, ohne Schlüssel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalisiereSlug, neuerInhalt, brauchtUmleitung, naechsterStatus, pfad } from '../src/pages.js';
import { mergeFakten } from '../src/config.js';
import { parseCookies, passwortStimmt } from '../src/auth.js';
import { getType } from '../src/archetypes.js';
import { pruefeBloecke } from '../src/blocks/index.js';

test('Slug: Umlaute, Sonderzeichen, Länge', () => {
  assert.equal(normalisiereSlug('Über uns – Schorni erzählt!'), 'ueber-uns-schorni-erzaehlt');
  assert.equal(normalisiereSlug('  Wasser / Ratgeber  '), 'wasser-ratgeber');
  assert.equal(normalisiereSlug(''), '');
});

test('Neue Seite besteht aus den Pflichtbausteinen ihres Typs', () => {
  const inhalt = neuerInhalt(getType('recht'));
  assert.deepEqual(inhalt.blocks.map((b) => b.type), ['nav', 'hero', 'richtext', 'footer']);
});

test('Slug-Wechsel einer öffentlichen Seite braucht eine Umleitung, Entwurf nicht', () => {
  assert.equal(brauchtUmleitung({ status: 'published', slug: 'alt' }, 'neu'), true);
  assert.equal(brauchtUmleitung({ status: 'published', slug: 'alt' }, 'alt'), false);
  assert.equal(brauchtUmleitung({ status: 'draft', slug: 'alt' }, 'neu'), false);
  assert.equal(pfad('alt'), '/alt/');
});

test('Statuskette: Bearbeiten macht edited, Veröffentlichtes bleibt, Wahl gilt', () => {
  assert.equal(naechsterStatus({ status: 'draft' }), 'edited');
  assert.equal(naechsterStatus({ status: 'generated' }), 'edited');
  assert.equal(naechsterStatus({ status: 'published' }), 'published');
  assert.equal(naechsterStatus({ status: 'edited' }, 'published'), 'published');
  assert.equal(naechsterStatus({ status: 'published' }, 'unsinn'), 'published');
});

test('Fakten: Override gewinnt, neue Dateifelder überleben, verschachtelt gemischt', () => {
  const datei = { telefon: '1', anschrift: { ort: 'Bunde', plz: '26831' }, neu: 'x' };
  const override = { telefon: '2', anschrift: { ort: 'Leer' } };
  assert.deepEqual(mergeFakten(datei, override), { telefon: '2', anschrift: { ort: 'Leer', plz: '26831' }, neu: 'x' });
  assert.deepEqual(mergeFakten(datei, null), datei);
});

test('Cookies parsen, Passwort ohne Konfiguration nie richtig', () => {
  assert.deepEqual(parseCookies('a=1; motor_session=abc%20d'), { a: '1', motor_session: 'abc d' });
  delete process.env.ADMIN_PASSWORD;
  assert.equal(passwortStimmt('irgendwas'), false);
  process.env.ADMIN_PASSWORD = 'geheim';
  assert.equal(passwortStimmt('geheim'), true);
  assert.equal(passwortStimmt('geheim '), false);
  delete process.env.ADMIN_PASSWORD;
});

test('Bausteinprüfung: Bild ohne Alt-Text und ungültiger Formularname scheitern', () => {
  assert.equal(pruefeBloecke([{ type: 'bild', data: { src: '/uploads/x.png', alt: '' } }]).length, 1);
  assert.equal(pruefeBloecke([{ type: 'bild', data: { src: '/uploads/x.png', alt: 'Ein Tank' } }]).length, 0);
  assert.equal(pruefeBloecke([{ type: 'hero', data: { bild: '/img/x.png', bildAlt: '' } }]).length, 1);
  assert.ok(pruefeBloecke([{ type: 'form', data: { name: 'Böse Name!', felder: [] } }]).length >= 1);
});
