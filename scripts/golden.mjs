/**
 * Goldreferenz erzeugen (P4): node scripts/golden.mjs <typ>
 * Nimmt die erste Seite aus content/*.json dieses Typs — dieselbe Regel wie der Generator —,
 * rendert sie mit Menü, Fakten und Bestand aus der Datenbank und schreibt
 * page-types/<typ>/golden.html. Ein neuer Seitentyp ist damit: Ordner, schema.json, eine
 * Seite in content/, dieser Befehl.
 */
import 'dotenv/config';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { runMigrations } from '../src/db.js';
import { getType } from '../src/archetypes.js';
import { renderPage } from '../src/renderer.js';
import { ladeFakten } from '../src/fakten.js';
import { dynamik } from '../src/routes/public.js';

const typName = process.argv[2];
const typ = typName && getType(typName);
if (!typ) {
  console.error(`Seitentyp fehlt oder unbekannt: ${typName || '(leer)'}. Vorhanden: ${readdirSync('page-types').join(', ')}`);
  process.exit(1);
}
await runMigrations();
const datei = readdirSync('content').filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort()
  .find((f) => JSON.parse(readFileSync(`content/${f}`, 'utf8')).page_type === typ.name);
if (!datei) { console.error(`Keine Seite vom Typ ${typ.name} in content/`); process.exit(1); }
const seite = JSON.parse(readFileSync(`content/${datei}`, 'utf8'));
const page = { ...seite, status: 'published', content_json: seite.content };
const html = renderPage(page, { facts: await ladeFakten(), dynamicData: await dynamik(page) });
const ziel = `page-types/${typ.name}/golden.html`;
const kopf = `<!-- Goldreferenz Seitentyp "${typ.name}" (P4), erzeugt am ${new Date().toISOString().slice(0, 10)} aus content/${datei}. Jeder Generator-Lauf fuer diesen Typ wird gegen diese Datei abgenommen. -->\n`;
writeFileSync(ziel, kopf + html);
console.log(`[Golden] ${ziel} aus content/${datei}`);
process.exit(0);
