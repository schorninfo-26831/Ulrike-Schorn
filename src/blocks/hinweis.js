import { html } from './_util.js';

/**
 * Pflichthinweis, vom übrigen Text abgehoben. Vorgabe ist der Biozid-Pflichtsatz nach
 * Artikel 72 Biozid-VO aus den Fakten — er gehört auf jede Seite, auf der ein
 * Biozidprodukt beworben wird. KXpress (Entkalker) braucht ihn nicht.
 */
export default {
  name: 'hinweis',
  label: 'Pflichthinweis',
  schema: {
    text: { type: 'text', default: '{{facts.biozidPflichthinweis}}', label: 'Hinweistext (Vorgabe: Biozid-Pflichtsatz aus den Fakten)' },
  },
  css: `
    .hinweis { padding-block: 0 44px; }
    .hinweis__box { margin: 0; max-width: 68ch; border: 1.5px solid var(--text); border-radius: 8px;
      padding: 14px 18px; font-weight: 600; font-size: 15.5px; line-height: 1.5; background: var(--grund-2); }
  `,
  render(data) {
    if (!data.text) return '';
    return html`
      <section class="section hinweis"><div class="container">
        <p class="hinweis__box">${data.text}</p>
      </div></section>`;
  },
};
