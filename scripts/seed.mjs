/**
 * Legt die Startseite an, falls sie fehlt (Stufe 1: „eine Testzeile in pages").
 * Idempotent — ein zweiter Lauf ändert nichts. Die endgültigen Texte entstehen in
 * Stufe 2 als Goldreferenz; bis dahin steht hier echter Inhalt, kein Lorem Ipsum.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { runMigrations, query, queryOne } from '../src/db.js';
import { validateContent } from '../src/archetypes.js';

await runMigrations();

const inhalt = {
  blocks: [
    { type: 'nav', data: {} },
    {
      type: 'hero',
      data: {
        pill: 'Camping Schorni · seit {{facts.seit}}',
        titel: 'Sauberes Wasser im Wohnmobil. Verständlich erklärt.',
        sub: 'Du willst unterwegs einfach gutes Wasser aus dem Hahn. Hier erfährst du, was im Tank wirklich passiert und was du dagegen tun kannst. Schorni erklärt es dir so, wie er es am Telefon auch tun würde.',
        ctaLabel: 'Zum passenden Produkt im Shop',
        ctaHref: '{{facts.shopUrl}}/collections/wasser',
      },
    },
    {
      type: 'richtext',
      data: {
        titel: 'Was du hier findest',
        text: [
          '**Der Wasser-Ratgeber.** Konservieren, entkalken, desinfizieren, filtern. Was wann sinnvoll ist, in der richtigen Reihenfolge.',
          '**Schorni persönlich.** Wer hinter dem Shop steht und warum Beratung hier vor dem Verkauf kommt.',
          '**Ein kurzer Draht.** Bleibt eine Frage offen, ruf an: {{facts.telefon}}. Die Produkte selbst findest du im Shop.',
        ].join('\n\n'),
      },
    },
    {
      type: 'cta',
      data: {
        titel: 'Bereit für sauberes Wasser?',
        text: 'Alles, was Schorni empfiehlt, gibt es im Shop. Sortiert nach Tankgröße und Anwendung.',
        label: 'Zum Sortiment Wasser',
        href: '{{facts.shopUrl}}/collections/wasser',
      },
    },
    { type: 'footer', data: {} },
  ],
};

const pruefung = validateContent('home', inhalt);
if (!pruefung.ok) {
  console.error('[Seed] Inhalt verletzt den Vertrag:', pruefung.fehler.join(' · '));
  process.exit(1);
}

const vorhanden = await queryOne('SELECT id FROM pages WHERE slug = $1', ['start']);
if (vorhanden) {
  console.log('[Seed] Startseite existiert bereits — nichts geändert.');
} else {
  const jetzt = new Date().toISOString();
  await query(
    `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [randomUUID(), 'start', 'home', 'published',
      'Sauberes Wasser im Wohnmobil',
      'Sauberes Wasser im Wohnmobil, verständlich erklärt. Ratgeber und Beratung von Camping Schorni.',
      JSON.stringify(inhalt), jetzt, jetzt]);
  console.log('[Seed] Startseite angelegt: /start/ (Status: published)');
}
