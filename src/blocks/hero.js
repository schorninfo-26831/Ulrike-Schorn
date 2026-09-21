import { html, raw, escapeAttr, ziel } from './_util.js';

/**
 * Aufmacher — das Muster für alle Bausteine: Schema, Vorgaben, css, render().
 * Stufe 2: Bild rechts (Schorni), auf dem Telefon unter dem Text; Abstände
 * wachsen mit der Bildschirmbreite statt fest 120 px zu sein.
 */
export default {
  name: 'hero',
  label: 'Aufmacher',
  schema: {
    pill:     { type: 'text',     default: '',  label: 'Kleine Zeile darüber' },
    titel:    { type: 'text',     default: '',  label: 'Überschrift' },
    sub:      { type: 'longtext', default: '',  label: 'Untertitel' },
    ctaLabel: { type: 'text',     default: '',  label: 'Knopf-Beschriftung' },
    ctaHref:  { type: 'text',     default: '',  label: 'Knopf-Ziel' },
    bild:     { type: 'image',    default: '',  label: 'Bild rechts (optional)' },
    bildAlt:  { type: 'text',     default: '',  label: 'Bild-Alternativtext (Pflicht, wenn Bild)' },
  },
  css: `
    .hero { padding: clamp(40px, 7vw, 88px) 0 clamp(40px, 6vw, 72px); }
    .hero__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 28px; align-items: center; }
    .hero__pill { font-family: var(--font-mono); font-size: 12px;
      letter-spacing: .12em; text-transform: uppercase; color: var(--signal); margin: 0; }
    .hero__titel { font-size: clamp(32px, 5vw, 58px); font-weight: 800;
      line-height: 1.08; margin: 12px 0 16px; max-width: 16ch; }
    .hero__sub { font-size: 18px; line-height: 1.6; color: var(--text-muted);
      max-width: 58ch; }
    .hero__cta { display: inline-block; margin-top: 24px; padding: 14px 26px;
      border-radius: 999px; background: var(--handlung); color: var(--handlung-text);
      font-weight: 700; text-decoration: none; }
    .hero__bild { justify-self: center; width: min(240px, 60vw); }
    .hero__bild img { display: block; width: 100%; height: auto; }
    @media (min-width: 800px) {
      .hero__grid { grid-template-columns: minmax(0, 1fr) minmax(0, 340px); gap: 48px; }
      .hero__bild { width: 100%; justify-self: end; }
    }
  `,
  render(data) {
    const bild = ziel(data.bild);
    return html`
      <section class="section hero"><div class="container hero__grid">
        <div>
          ${data.pill ? html`<p class="hero__pill">${data.pill}</p>` : ''}
          <h1 class="hero__titel">${data.titel}</h1>
          ${data.sub ? html`<p class="hero__sub">${data.sub}</p>` : ''}
          ${data.ctaLabel && ziel(data.ctaHref)
            ? html`<a class="hero__cta" href="${raw(escapeAttr(ziel(data.ctaHref)))}">${data.ctaLabel}</a>`
            : ''}
        </div>
        ${bild && data.bildAlt
          ? html`<figure class="hero__bild"><img src="${raw(escapeAttr(bild))}" alt="${data.bildAlt}" width="400" height="400"></figure>`
          : ''}
      </div></section>`;
  },
};
