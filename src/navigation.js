/**
 * Die Navigation ist Daten, kein Code (3.2). Der Baum kommt aus der Tabelle; ein
 * Menüpunkt, der auf eine unveröffentlichte oder gelöschte Seite zeigt, wird
 * versteckt statt ins Leere zu führen. Das Cockpit warnt davor.
 */
import { query } from './db.js';

export async function ladeBaum() {
  const zeilen = await query(
    'SELECT id, parent_id, label, href, sort FROM navigation WHERE visible = 1 ORDER BY sort');
  const oeffentlich = new Set((await query("SELECT slug FROM pages WHERE status = 'published'")).map((r) => `/${r.slug}/`));
  const zeigtInsLeere = (href) => /^\/[a-z0-9-]+\/?$/.test(href) && !oeffentlich.has(href.replace(/\/?$/, '/'));
  const gueltig = zeilen.filter((z) => !zeigtInsLeere(z.href));
  return gueltig.filter((z) => !z.parent_id)
    .map((z) => ({ label: z.label, href: z.href, kinder: gueltig.filter((k) => k.parent_id === z.id).map((k) => ({ label: k.label, href: k.href })) }));
}

/** Für das Cockpit: der rohe Baum samt Warnung je Punkt. */
export async function ladeBaumRoh() {
  const zeilen = await query('SELECT id, parent_id, label, href, sort, visible FROM navigation ORDER BY sort');
  const oeffentlich = new Set((await query("SELECT slug FROM pages WHERE status = 'published'")).map((r) => `/${r.slug}/`));
  const warnung = (href) => (/^\/[a-z0-9-]+\/?$/.test(href) && !oeffentlich.has(href.replace(/\/?$/, '/')))
    ? 'Ziel ist nicht veröffentlicht — der Punkt wird auf der Seite versteckt' : '';
  return zeilen.filter((z) => !z.parent_id).map((z) => ({
    id: z.id, label: z.label, href: z.href, warnung: warnung(z.href),
    kinder: zeilen.filter((k) => k.parent_id === z.id).map((k) => ({ id: k.id, label: k.label, href: k.href, warnung: warnung(k.href) })),
  }));
}
