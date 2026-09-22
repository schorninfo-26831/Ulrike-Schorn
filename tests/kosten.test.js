// Kosten (Stufe 4/7): reine Rechnung, ohne Datenbank und ohne Schlüssel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berechne, formatEuro, beschreibe, mitKosten, preisFuer } from '../src/kosten.js';
import { loadKosten } from '../src/config.js';

const cfg = { usdEur: 0.5, cacheSchreiben: 1.25, cacheLesen: 0.1, preise: { 'claude-opus-5': { eingabe: 5, ausgabe: 25 }, 'claude-sonnet-5': { eingabe: 2, ausgabe: 10 } } };

test('Kosten: vier Token-Sorten, Preise aus der Konfiguration, Euro über den Kurs, unbekanntes Modell ohne Zahl', () => {
  assert.deepEqual(berechne({ modell: 'claude-opus-5', eingabe: 1_000_000, ausgabe: 0 }, cfg), { usd: 5, eur: 2.5, text: 'etwa 2,50 €' });
  const c = berechne({ modell: 'claude-opus-5', eingabe: 0, ausgabe: 0, cache: 1_000_000, cacheSchreiben: 1_000_000 }, cfg);
  assert.equal(c.usd, 6.25 + 0.5);
  const u = berechne({ modell: 'claude-opus-5', eingabe: 435, ausgabe: 2296 }, cfg);
  assert.ok(Math.abs(u.usd - 0.059575) < 1e-9);
  assert.equal(berechne({ modell: 'irgendwas', eingabe: 1 }, cfg), null);
  assert.equal(berechne({ eingabe: 1 }, cfg), null);
  assert.equal(preisFuer('claude-sonnet-5-20270101', cfg).ausgabe, 10);
});

test('Euro-Text: zwei Stellen, unter einem Cent in Cent, ganz klein „unter 0,1 Cent"', () => {
  assert.equal(formatEuro(0.19), '0,19 €');
  assert.equal(formatEuro(1.5), '1,50 €');
  assert.equal(formatEuro(0.004), '0,4 Cent');
  assert.equal(beschreibe(0.0002), 'unter 0,1 Cent');
  assert.equal(beschreibe(0.19), 'etwa 0,19 €');
  const m = mitKosten({ modell: 'claude-sonnet-5', eingabe: 100, ausgabe: 200 }, cfg);
  assert.equal(m.kosten.text, 'etwa 0,1 Cent');
  assert.equal(mitKosten({ eingabe: 100 }, cfg).kosten, null);
  assert.equal(mitKosten(null, cfg), null);
});

test('config/kosten.json: die beiden Standardmodelle haben Preise, der Kurs ist gesetzt', () => {
  const k = loadKosten();
  assert.equal(preisFuer('claude-opus-5', k).eingabe, 5);
  assert.equal(preisFuer('claude-sonnet-5', k).ausgabe, 10);
  assert.ok(k.usdEur > 0.5 && k.usdEur < 1.5);
  assert.ok(k.stand);
});
