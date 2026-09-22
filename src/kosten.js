/**
 * Kosten in Euro (Stufe 4 und 7). Der Anbieter rechnet in US-Dollar je Million Token, in vier
 * Sorten: Eingabe, Ausgabe, Zwischenspeicher schreiben (1,25-fache Eingabe) und lesen (ein Zehntel).
 * Preise und Wechselkurs stehen in config/kosten.json, nie im Code (P2 für Zahlen). Ein Modell, das
 * dort fehlt, bekommt keine Zahl statt einer falschen. Reine Rechnung, keine Datenbank: läuft in Tests.
 */
import { loadKosten } from './config.js';

const n = (x) => Number(x) || 0;

/** Preis je Modell; ein Name mit Datumsanhang findet seinen Stamm (längster passender Schlüssel). */
export function preisFuer(modell, cfg = loadKosten()) {
  if (!modell) return null;
  const preise = cfg.preise || {};
  if (preise[modell]) return preise[modell];
  const stamm = Object.keys(preise).filter((k) => String(modell).startsWith(k)).sort((a, b) => b.length - a.length)[0];
  return stamm ? preise[stamm] : null;
}

/** Betrag eines Laufs in Dollar und Euro, oder null, wenn das Modell unbekannt ist. */
export function berechne(verbrauch, cfg = loadKosten()) {
  const p = preisFuer(verbrauch?.modell, cfg);
  if (!p) return null;
  const usd = (n(verbrauch.eingabe) * p.eingabe
    + n(verbrauch.cacheSchreiben) * p.eingabe * (cfg.cacheSchreiben ?? 1.25)
    + n(verbrauch.cache) * p.eingabe * (cfg.cacheLesen ?? 0.1)
    + n(verbrauch.ausgabe) * p.ausgabe) / 1e6;
  const eur = usd * (cfg.usdEur || 1);
  return { usd, eur, text: beschreibe(eur) };
}

/** „0,19 €", „1,50 €", unter einem Cent „0,4 Cent". */
export function formatEuro(eur) {
  if (!(eur >= 0)) return '?';
  if (eur >= 0.01) return eur.toFixed(2).replace('.', ',') + ' €';
  return (eur * 100).toFixed(1).replace('.', ',') + ' Cent';
}

/** Für Menschen: „etwa 0,19 €", ganz kleine Beträge „unter 0,1 Cent". */
export function beschreibe(eur) {
  if (!(eur >= 0)) return '';
  if (eur < 0.0005) return 'unter 0,1 Cent';
  return 'etwa ' + formatEuro(eur);
}

/** Hängt an einen Verbrauch die Kosten an: { …, kosten: { usd, eur, text } | null }. */
export const mitKosten = (verbrauch, cfg) => (verbrauch ? { ...verbrauch, kosten: berechne(verbrauch, cfg) } : verbrauch);
