import { html, reihe, absaetze, markdownInline } from './_util.js';

/** Fließtext mit optionaler Überschrift. Absätze an Leerzeilen, Markdown-inline. */
export default {
  name: 'richtext',
  label: 'Fließtext',
  schema: {
    titel: { type: 'text',     default: '', label: 'Überschrift (optional)' },
    text:  { type: 'longtext', default: '', label: 'Text — Absätze durch Leerzeile, **fett**, [Link](Ziel)' },
  },
  css: `
    .richtext__inner { max-width: 68ch; }
    .richtext__titel { font-size: clamp(24px, 3vw, 34px); margin-bottom: 18px; }
    .richtext p { font-size: 17px; }
    .richtext strong { font-weight: 700; color: var(--handlung); }
  `,
  render(data) {
    const abs = absaetze(data.text).map((p) => html`<p>${markdownInline(p)}</p>`);
    return html`
      <section class="section richtext"><div class="container richtext__inner">
        ${data.titel ? html`<h2 class="richtext__titel">${data.titel}</h2>` : ''}
        ${reihe(abs)}
      </div></section>`;
  },
};
