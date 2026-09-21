import { html, raw, reihe, escapeAttr, ziel, markdownInline } from './_util.js';

/**
 * Karten: eine Überschrift, zwei bis vier gleich gebaute Kästen. Jede Karte hat
 * Titel, Text und optional einen Link. Gleiche Kanten, gleiche Innenabstände —
 * Wiederholtes wird als ein Objekt komponiert.
 */
export default {
  name: 'cards',
  label: 'Karten',
  schema: {
    eyebrow: { type: 'text', default: '', label: 'Kleine Zeile über der Überschrift' },
    titel:   { type: 'text', default: '', label: 'Überschrift' },
    items:   { type: 'list', default: [], label: 'Karten',
               felder: { titel: 'text', text: 'longtext', label: 'text', href: 'text' } },
  },
  css: `
    .cards__kopf { max-width: 60ch; margin-bottom: 28px; }
    .cards__titel { font-size: clamp(24px, 3vw, 34px); }
    .cards__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
    .card { background: var(--grund-2); border: 1px solid var(--grund-3); border-radius: var(--radius);
      padding: 24px 22px; display: flex; flex-direction: column; gap: 10px; }
    .card__titel { font-size: 19px; color: var(--handlung); }
    .card__text { margin: 0; color: var(--text-muted); font-size: 15.5px; flex: 1; }
    .card__link { align-self: flex-start; margin-top: 6px; font-weight: 700; color: var(--handlung);
      text-decoration: none; border-bottom: 2px solid var(--signal); padding-bottom: 1px; }
  `,
  render(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const karten = items.map((k) => {
      const z = ziel(k.href);
      return html`
        <article class="card">
          <h3 class="card__titel">${k.titel}</h3>
          <p class="card__text">${markdownInline(k.text)}</p>
          ${k.label && z ? html`<a class="card__link" href="${raw(escapeAttr(z))}">${k.label} &rarr;</a>` : ''}
        </article>`;
    });
    return html`
      <section class="section cards"><div class="container">
        ${data.eyebrow || data.titel ? html`<div class="cards__kopf">
          ${data.eyebrow ? html`<p class="eyebrow">${data.eyebrow}</p>` : ''}
          ${data.titel ? html`<h2 class="cards__titel">${data.titel}</h2>` : ''}
        </div>` : ''}
        <div class="cards__grid">${reihe(karten)}</div>
      </div></section>`;
  },
};
