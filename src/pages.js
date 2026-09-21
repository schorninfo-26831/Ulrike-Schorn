/** Reine Helfer rund um Seiten — ohne Datenbank, deshalb testbar. */

/** Die Statuskette ist heilig (P5). */
export const STATUS = ['draft', 'generated', 'edited', 'approved', 'published', 'archived'];

/** Aus einem Titel einen Slug: klein, Umlaute aufgelöst, nur a-z 0-9 und Bindestrich. */
export function normalisiereSlug(s) {
  return String(s ?? '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

/** Neue Seite eines Typs: die Pflichtbausteine, sonst nichts. */
export function neuerInhalt(typ) {
  return { blocks: (typ?.schema?.requiredBlocks || []).map((t) => ({ type: t, data: {} })) };
}

/** Slug-Wechsel einer öffentlichen Seite hinterlässt eine Spur (3.1). */
export function brauchtUmleitung(alt, neuerSlug) {
  return alt.status === 'published' && neuerSlug !== alt.slug;
}

/**
 * Status nach einem Speichern im Cockpit: eine ausdrückliche Wahl gilt; sonst wird
 * eine bearbeitete Seite 'edited' — außer sie ist öffentlich oder archiviert, das
 * ändert ein Textkorrektur nicht.
 */
export function naechsterStatus(alt, gewuenscht) {
  if (gewuenscht && STATUS.includes(gewuenscht) && gewuenscht !== alt.status) return gewuenscht;
  return alt.status === 'published' || alt.status === 'archived' ? alt.status : 'edited';
}

/** Pfad für Umleitungen: immer mit führendem und schließendem Schrägstrich. */
export const pfad = (slug) => `/${String(slug).replace(/^\/+|\/+$/g, '')}/`;
