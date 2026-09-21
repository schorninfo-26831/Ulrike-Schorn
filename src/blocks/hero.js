import { html, raw, escapeAttr, ziel } from './_util.js';

/** Aufmacher — das Muster für alle Bausteine: Schema, Vorgaben, css, render(). */
export default {
  name: 'hero',
  label: 'Aufmacher',
  schema: {
    pill:     { type: 'text',     default: '',  label: 'Kleine Zeile darüber' },
    titel:    { type: 'text',     default: '',  label: 'Überschrift' },
    sub:      { type: 'longtext', default: '',  label: 'Untertitel' },
    ctaLabel: { type: 'text',     default: '',  label: 'Knopf-Beschriftung' },
    ctaHref:  { type: 'text',     default: '',  label: 'Knopf-Ziel' },
  },
  css: `
    .hero { padding: 120px 0 72px; }
    .hero__pill { font-family: var(--font-mono); font-size: 12px;
      letter-spacing: .12em; text-transform: uppercase; color: var(--signal); }
    .hero__titel { font-size: clamp(32px, 5vw, 60px); font-weight: 800;
      line-height: 1.08; margin: 12px 0 16px; max-width: 16ch; }
    .hero__sub { font-size: 18px; line-height: 1.6; color: var(--text-muted);
      max-width: 60ch; }
    .hero__cta { display: inline-block; margin-top: 28px; padding: 14px 26px;
      border-radius: 999px; background: var(--handlung); color: var(--handlung-text);
      font-weight: 700; text-decoration: none; }
  `,
  render(data) {
    return html`
      <section class="section hero"><div class="container">
        ${data.pill ? html`<p class="hero__pill">${data.pill}</p>` : ''}
        <h1 class="hero__titel">${data.titel}</h1>
        ${data.sub ? html`<p class="hero__sub">${data.sub}</p>` : ''}
        ${data.ctaLabel && ziel(data.ctaHref)
          ? html`<a class="hero__cta" href="${raw(escapeAttr(ziel(data.ctaHref)))}">${data.ctaLabel}</a>`
          : ''}
      </div></section>`;
  },
};
