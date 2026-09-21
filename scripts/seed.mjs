/**
 * Spielt die Seiten aus content/*.json in die Datenbank. Jede Datei ist eine Seite:
 * { slug, page_type, status, title, description, content: { blocks } }.
 *
 * Idempotent: vorhandene Seiten bleiben unangetastet. `npm run seed -- --force`
 * überschreibt sie (P5: Regeneration braucht ein ausdrückliches Force). Jeder Inhalt
 * wird vorher gegen den Vertrag des Seitentyps geprüft — hier scheitert er, nicht
 * auf der Seite.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { runMigrations, query, queryOne } from '../src/db.js';
import { validateContent } from '../src/archetypes.js';

const FORCE = process.argv.includes('--force');
await runMigrations();

const dateien = readdirSync('content').filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort();
let fehler = 0;

// Anfangsmenü — nur, wenn die Tabelle leer ist. Danach pflegt das Cockpit die Navigation (3.2).
const menue = JSON.parse(readFileSync('content/_navigation.json', 'utf8'));
const vorhandeneMenues = await query('SELECT COUNT(*) AS n FROM navigation');
if (Number(vorhandeneMenues[0].n) === 0) {
  let sort = 0;
  for (const p of menue.punkte) {
    const id = randomUUID();
    await query('INSERT INTO navigation (id, parent_id, label, href, sort, visible) VALUES ($1, NULL, $2, $3, $4, 1)', [id, p.label, p.href, sort++]);
    for (const k of p.kinder || []) {
      await query('INSERT INTO navigation (id, parent_id, label, href, sort, visible) VALUES ($1, $2, $3, $4, $5, 1)', [randomUUID(), id, k.label, k.href, sort++]);
    }
  }
  console.log(`[Seed] Menü angelegt: ${menue.punkte.map((p) => p.label).join(' · ')}`);
} else {
  console.log('[Seed] Menü vorhanden — unverändert (Pflege im Cockpit)');
}

for (const datei of dateien) {
  const seite = JSON.parse(readFileSync(`content/${datei}`, 'utf8'));
  const pruefung = validateContent(seite.page_type, seite.content);
  if (!pruefung.ok) {
    console.error(`[Seed] ${datei}: verletzt den Vertrag — ${pruefung.fehler.join(' · ')}`);
    fehler++;
    continue;
  }

  const jetzt = new Date().toISOString();
  const vorhanden = await queryOne('SELECT id FROM pages WHERE slug = $1', [seite.slug]);

  if (vorhanden && !FORCE) {
    console.log(`[Seed] /${seite.slug}/ vorhanden — unverändert`);
  } else if (vorhanden) {
    await query(
      `UPDATE pages SET page_type = $1, status = $2, title = $3, description = $4, content_json = $5, updated_at = $6
       WHERE slug = $7`,
      [seite.page_type, seite.status, seite.title, seite.description, JSON.stringify(seite.content), jetzt, seite.slug]);
    console.log(`[Seed] /${seite.slug}/ überschrieben (--force)`);
  } else {
    await query(
      `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [randomUUID(), seite.slug, seite.page_type, seite.status, seite.title, seite.description,
        JSON.stringify(seite.content), jetzt, jetzt]);
    console.log(`[Seed] /${seite.slug}/ angelegt (${seite.status})`);
  }
}

if (fehler) {
  console.error(`[Seed] ${fehler} Datei(en) abgelehnt.`);
  process.exit(1);
}
