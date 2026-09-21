import { html, raw, reihe, escapeAttr, ziel } from './_util.js';

/**
 * Kopfzeile. Das Menü (data.baum) kommt ab Stufe 3 aus der Datenbank, nie aus
 * diesem Baustein. Rechts: das Telefon leise, der Shop-Knopf laut — so steht es
 * in docs/entscheidungen.md.
 */
export default {
  name: 'nav',
  label: 'Kopfzeile',
  schema: {
    marke:     { type: 'text', default: 'Camping Schorni',              label: 'Markenname' },
    claim:     { type: 'text', default: 'Sauberes Wasser im Wohnmobil', label: 'Kurzer Claim unter der Marke' },
    telefon:   { type: 'text', default: '{{facts.telefon}}',            label: 'Telefon (aus den Fakten)' },
    shopLabel: { type: 'text', default: 'Zum Shop',                     label: 'Shop-Knopf' },
    shopHref:  { type: 'text', default: '{{facts.shopUrl}}',            label: 'Shop-Ziel (aus den Fakten)' },
  },
  css: `
    .nav { position: sticky; top: 0; z-index: 10; background: var(--grund);
      border-bottom: 1px solid var(--grund-3); }
    .nav__zeile { display: flex; align-items: center; gap: 18px 28px; flex-wrap: wrap;
      padding-block: 14px; }
    .nav__marke { font-family: var(--font-display); font-weight: 800; font-size: 20px;
      color: var(--handlung); text-decoration: none; letter-spacing: -.02em; line-height: 1.1; }
    .nav__marke small { display: block; font-family: var(--font-body); font-weight: 500;
      font-size: 12px; color: var(--text-muted); letter-spacing: 0; margin-top: 2px; }
    .nav__menue { display: flex; gap: 20px; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
    .nav__menue a { color: var(--text); text-decoration: none; font-weight: 500; }
    .nav__rechts { margin-left: auto; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .nav__telefon { color: var(--text-muted); text-decoration: none; font-size: 15px; white-space: nowrap; }
    .nav__shop { display: inline-block; padding: 10px 18px; border-radius: 999px;
      background: var(--handlung); color: var(--handlung-text); font-weight: 700;
      text-decoration: none; font-size: 15px; white-space: nowrap; }
  `,
  render(data) {
    const baum = Array.isArray(data.baum) ? data.baum : [];
    const punkte = baum.map((p) =>
      html`<li><a href="${raw(escapeAttr(ziel(p.href)))}">${p.label}</a></li>`);
    const telHref = ziel(`tel:${String(data.telefon || '').replace(/[^\d+]/g, '')}`);
    return html`
      <header class="nav"><div class="container nav__zeile">
        <a class="nav__marke" href="/">${data.marke}${data.claim ? html`<small>${data.claim}</small>` : ''}</a>
        ${punkte.length ? html`<nav aria-label="Hauptmenü"><ul class="nav__menue">${reihe(punkte, '')}</ul></nav>` : ''}
        <div class="nav__rechts">
          ${data.telefon && telHref ? html`<a class="nav__telefon" href="${raw(escapeAttr(telHref))}">${data.telefon}</a>` : ''}
          ${data.shopLabel && ziel(data.shopHref)
            ? html`<a class="nav__shop" href="${raw(escapeAttr(ziel(data.shopHref)))}">${data.shopLabel}</a>`
            : ''}
        </div>
      </div></header>`;
  },
};
