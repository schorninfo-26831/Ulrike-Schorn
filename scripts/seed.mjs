/**
 * Legt die Startseite an, falls sie fehlt. Idempotent — ein zweiter Lauf ändert nichts.
 *
 * `npm run seed -- --force` überschreibt den Inhalt der Startseite (P5: Regeneration
 * braucht ein ausdrückliches Force; nichts wird stillschweigend überschrieben).
 *
 * Der Inhalt hier ist die Goldreferenz (Stufe 2): echte Worte, Zahlen aus den Fakten.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { runMigrations, query, queryOne } from '../src/db.js';
import { validateContent } from '../src/archetypes.js';

const FORCE = process.argv.includes('--force');
await runMigrations();

const start = {
  slug: 'start',
  page_type: 'home',
  status: 'published',
  title: 'Sauberes Wasser im Wohnmobil',
  description: 'Sauberes Wasser im Wohnmobil, verständlich erklärt. Ratgeber und Beratung von Camping Schorni, Produkte im Shop.',
  content: {
    blocks: [
      { type: 'nav', data: {} },
      {
        type: 'hero',
        data: {
          pill: 'Camping Schorni · seit {{facts.seit}}',
          titel: 'Sauberes Wasser im Wohnmobil. Verständlich erklärt.',
          sub: 'Du willst unterwegs einfach gutes Wasser aus dem Hahn. Hier erfährst du, was im Tank passiert, was wirklich hilft und in welcher Reihenfolge. Schorni erklärt es dir so, wie er es am Telefon auch tun würde: kurz, ehrlich und aus der Praxis.',
          ctaLabel: 'Zum passenden Produkt im Shop',
          ctaHref: '{{facts.shopUrl}}/collections/wasser',
          bild: '/img/schorni-logo.png',
          bildAlt: 'Schorni, das Maskottchen von Camping Schorni, zeigt mit dem Daumen nach oben',
        },
      },
      {
        type: 'cards',
        data: {
          eyebrow: 'Drei Wege',
          titel: 'Was du hier findest',
          items: [
            {
              titel: 'Der Wasser-Ratgeber',
              text: 'Konservieren, entkalken, desinfizieren, filtern. Was wann sinnvoll ist, in welcher Reihenfolge, und wo du dir Arbeit sparen kannst.',
              label: 'Zum Ratgeber',
              href: '/wasser-ratgeber/',
            },
            {
              titel: 'Schorni persönlich',
              text: 'Seit {{facts.seit}} auf Campingplätzen, Messen und in Werkstätten unterwegs. Wer hinter dem Shop steht und warum hier die Beratung an erster Stelle steht.',
              label: 'Über uns',
              href: '/ueber-uns/',
            },
            {
              titel: 'Ein kurzer Draht',
              text: 'Bleibt eine Frage offen, ruf einfach an: **{{facts.telefon}}**, {{facts.oeffnungszeitenKurz}}. Du bekommst eine ehrliche Empfehlung. Auch dann, wenn sie „lass es" lautet.',
              label: 'Kontakt',
              href: '/kontakt/',
            },
          ],
        },
      },
      {
        type: 'tipp',
        data: {
          text: '**Kalk zuerst.** Kalkablagerungen bremsen die Wärmeübertragung im Boiler und bieten Biofilm einen Untergrund. Wer vor der Saison entkalkt, macht alles danach leichter.',
        },
      },
      {
        type: 'cta',
        data: {
          titel: 'Bereit für sauberes Wasser?',
          text: 'Alles, was Schorni empfiehlt, findest du im Shop. Sortiert nach Tankgröße und Anwendung, mit ehrlichen Angaben zu jedem Produkt.',
          label: 'Zum Sortiment Wasser',
          href: '{{facts.shopUrl}}/collections/wasser',
        },
      },
      { type: 'footer', data: {} },
    ],
  },
};

const pruefung = validateContent(start.page_type, start.content);
if (!pruefung.ok) {
  console.error('[Seed] Inhalt verletzt den Vertrag:', pruefung.fehler.join(' · '));
  process.exit(1);
}

const jetzt = new Date().toISOString();
const vorhanden = await queryOne('SELECT id, status FROM pages WHERE slug = $1', [start.slug]);

if (vorhanden && !FORCE) {
  console.log(`[Seed] /${start.slug}/ existiert bereits — nichts geändert. Überschreiben mit: npm run seed -- --force`);
} else if (vorhanden) {
  await query(
    `UPDATE pages SET page_type = $1, status = $2, title = $3, description = $4, content_json = $5, updated_at = $6 WHERE slug = $7`,
    [start.page_type, start.status, start.title, start.description, JSON.stringify(start.content), jetzt, start.slug]);
  console.log(`[Seed] /${start.slug}/ überschrieben (--force).`);
} else {
  await query(
    `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [randomUUID(), start.slug, start.page_type, start.status, start.title, start.description,
      JSON.stringify(start.content), jetzt, jetzt]);
  console.log(`[Seed] /${start.slug}/ angelegt (Status: ${start.status}).`);
}
