/**
 * Fakten in zwei Ebenen (3.8): Datei = Grundstock, Datenbank = das, was jemand im
 * Cockpit geändert hat. Das Tor liest beide. Der Override gewinnt — deshalb wird
 * beim Speichern immer das ganze zusammengeführte Objekt abgelegt, und ein neues Feld
 * in der Datei erscheint, solange der Override es nicht überschattet.
 */
import { loadFacts, mergeFakten } from './config.js';
import { query } from './db.js';

export { mergeFakten };

export async function ladeFakten() {
  const datei = loadFacts();
  const zeilen = await query("SELECT wert FROM config_overrides WHERE schluessel = 'facts'");
  return zeilen.length ? mergeFakten(datei, JSON.parse(zeilen[0].wert)) : datei;
}

export async function speichereFakten(obj) {
  const jetzt = new Date().toISOString();
  await query("DELETE FROM config_overrides WHERE schluessel = 'facts'");
  await query('INSERT INTO config_overrides (schluessel, wert, updated_at) VALUES ($1, $2, $3)',
    ['facts', JSON.stringify(obj), jetzt]);
}
