import { html, reihe, absaetze, markdownInline } from './_util.js';

/**
 * Fließtext mit optionaler Überschrift. Absätze an Leerzeilen, Markdown-inline.
 * Der Text bleibt linksbündig im selben Raster wie Kopf und Karten; nur seine
 * Breite ist auf eine lesbare Zeile begrenzt. Folgen mehrere Fließtexte direkt
 * aufeinander (Rechtstexte), rücken sie enger zusammen.
 */
export default {
  name: 'richtext',
  label: 'Fließtext',
  schema: {
    titel: { type: 'text',     default: '', label: 'Überschrift (optional)' },
    text:  { type: 'longtext', default: '', label: 'Text — Absätze durch Leerzeile, **fett**, [Link](Ziel)' },
  },
  css: `
    .richtext__text { max-width: 68ch; }
    .richtext__titel { font-size: clamp(24px, 3vw, 34px); margin-bottom: 18px; }
    .richtext p { font-size: 17px; }
    .richtext p:last-child { margin-bottom: 0; }
    .richtext strong { font-weight: 700; color: var(--handlung); }
    .richtext + .richtext { padding-top: 0; }
  `,
  render(data) {
    const abs = absaetze(data.text).map((p) => html`<p>${markdownInline(p)}</p>`);
    return html`
      <section class="section richtext"><div class="container"><div class="richtext__text">
        ${data.titel ? html`<h2 class="richtext__titel">${data.titel}</h2>` : ''}
        ${reihe(abs)}
      </div></div></section>`;
  },
};
