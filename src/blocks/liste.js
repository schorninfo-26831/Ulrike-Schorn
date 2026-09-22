import { html, raw, reihe, escapeAttr, ziel } from './_util.js';

/**
 * Übersicht (Stufe 6, P3): die Seite speichert keine Liste, sie liest den Bestand bei jedem
 * Aufruf. `seiten` kommt vom Router (alle veröffentlichten Seiten), der Baustein filtert nach
 * Seitentyp und lässt die eigene Seite weg. Wird eine neue Seite veröffentlicht, steht sie hier,
 * ohne dass jemand die Übersicht anfasst.
 */
export function sortiereBestand(seiten, sortierung = 'neueste') {
  const liste = [...seiten];
  if (sortierung === 'titel') return liste.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'de'));
  return liste.sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
}

export default {
  name: 'liste',
  label: 'Übersicht',
  schema: {
    eyebrow:    { type: 'text',   default: '', label: 'Kleine Zeile über der Überschrift' },
    titel:      { type: 'text',   default: '', label: 'Überschrift' },
    typ:        { type: 'select', default: 'ratgeber', label: 'Welche Seiten: Seitentyp', optionen: 'seitentypen' },
    sortierung: { type: 'select', default: 'neueste', label: 'Reihenfolge',
                  optionen: [{ value: 'neueste', label: 'Neueste zuerst' }, { value: 'titel', label: 'Nach Titel' }] },
    linkText:   { type: 'text',   default: 'Lesen', label: 'Link-Beschriftung' },
    leer:       { type: 'text',   default: 'Hier entsteht gerade etwas. Schau bald wieder vorbei.', label: 'Text, solange keine Seite da ist' },
  },
  css: `
    .liste__kopf { max-width: 60ch; margin-bottom: 28px; }
    .liste__titel { font-size: clamp(24px, 3vw, 34px); }
    .liste__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
    .liste__karte { background: var(--grund-2); border: 1px solid var(--grund-3); border-radius: var(--radius);
      padding: 22px; display: flex; flex-direction: column; gap: 10px; }
    .liste__bild { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: calc(var(--radius) - 6px); }
    .liste__karte h3 { font-size: 19px; margin: 0; }
    .liste__karte h3 a { color: var(--handlung); text-decoration: none; }
    .liste__text { margin: 0; color: var(--text-muted); font-size: 15.5px; flex: 1; }
    .liste__link { align-self: flex-start; margin-top: 6px; font-weight: 700; color: var(--handlung);
      text-decoration: none; border-bottom: 2px solid var(--signal); padding-bottom: 1px; }
    .liste__leer { color: var(--text-muted); }
  `,
  render(data) {
    const alle = Array.isArray(data.seiten) ? data.seiten : [];
    const seiten = sortiereBestand(
      alle.filter((s) => s.page_type === data.typ && s.slug !== data.eigenerSlug && (s.status ?? 'published') === 'published'),
      data.sortierung);
    const karten = seiten.map((s) => {
      const href = s.slug === 'start' ? '/' : `/${s.slug}/`;
      const bild = ziel(s.og_image);
      return html`
        <article class="liste__karte">
          ${bild ? html`<img class="liste__bild" src="${raw(escapeAttr(bild))}" alt="" loading="lazy">` : ''}
          <h3><a href="${raw(escapeAttr(href))}">${s.title}</a></h3>
          ${s.description ? html`<p class="liste__text">${s.description}</p>` : ''}
          <a class="liste__link" href="${raw(escapeAttr(href))}">${data.linkText || 'Lesen'} &rarr;</a>
        </article>`;
    });
    return html`
      <section class="section liste"><div class="container">
        ${data.eyebrow || data.titel ? html`<div class="liste__kopf">
          ${data.eyebrow ? html`<p class="eyebrow">${data.eyebrow}</p>` : ''}
          ${data.titel ? html`<h2 class="liste__titel">${data.titel}</h2>` : ''}
        </div>` : ''}
        ${karten.length ? html`<div class="liste__grid">${reihe(karten)}</div>` : html`<p class="liste__leer">${data.leer}</p>`}
      </div></section>`;
  },
};
