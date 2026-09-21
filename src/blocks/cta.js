import { html, raw, escapeAttr, ziel } from './_util.js';

/**
 * Die eine Handlung, als eigener Abschnitt. Die Signalfarbe markiert (Linie),
 * sie füllt nicht — der Knopf trägt die Handlungsfarbe.
 */
export default {
  name: 'cta',
  label: 'Handlungsaufruf',
  schema: {
    titel: { type: 'text',     default: '', label: 'Überschrift' },
    text:  { type: 'longtext', default: '', label: 'Ein bis zwei Sätze' },
    label: { type: 'text',     default: '', label: 'Knopf-Beschriftung' },
    href:  { type: 'text',     default: '', label: 'Knopf-Ziel' },
  },
  css: `
    .cta__box { background: var(--grund-2); border: 1px solid var(--grund-3);
      border-left: 5px solid var(--signal); border-radius: var(--radius);
      padding: 32px 28px; display: flex; flex-wrap: wrap; align-items: center; gap: 18px 32px; }
    .cta__text { flex: 1 1 320px; min-width: 0; }
    .cta__titel { font-size: clamp(22px, 2.6vw, 28px); margin-bottom: 8px; }
    .cta__text p { margin: 0; color: var(--text-muted); }
    .cta__knopf { display: inline-block; padding: 14px 26px; border-radius: 999px;
      background: var(--handlung); color: var(--handlung-text); font-weight: 700;
      text-decoration: none; white-space: nowrap; }
  `,
  render(data) {
    const z = ziel(data.href);
    return html`
      <section class="section cta"><div class="container">
        <div class="cta__box">
          <div class="cta__text">
            ${data.titel ? html`<h2 class="cta__titel">${data.titel}</h2>` : ''}
            ${data.text ? html`<p>${data.text}</p>` : ''}
          </div>
          ${data.label && z ? html`<a class="cta__knopf" href="${raw(escapeAttr(z))}">${data.label}</a>` : ''}
        </div>
      </div></section>`;
  },
};
