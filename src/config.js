/**
 * Lader für site/facts/theme. Liest bei jedem Aufruf — die Dateien sind klein,
 * und so greift eine Änderung ohne Neustart. Die Cockpit-Overrides (3.8) legt
 * src/fakten.js darüber; dieses Modul bleibt ohne Datenbank, damit Renderer und
 * Tests ohne sie auskommen.
 */
import { readFileSync } from 'node:fs';

const lies = (pfad) => JSON.parse(readFileSync(pfad, 'utf8'));

export const loadSite = () => lies('config/site.json');
export const loadFacts = () => lies('config/facts.json');
export const loadTheme = () => lies('config/theme.json');

/** Tiefes Zusammenführen: Override über Datei, verschachtelte Objekte werden gemischt. */
export function mergeFakten(datei, override) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return datei;
  const out = { ...datei };
  for (const [k, v] of Object.entries(override)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && datei[k] && typeof datei[k] === 'object'
      ? mergeFakten(datei[k], v) : v;
  }
  return out;
}
