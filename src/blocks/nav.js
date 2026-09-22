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
    logo:      { type: 'image', default: '/img/schorni-logo.png',         label: 'Logo' },
    logoAlt:   { type: 'text',  default: 'Schorni, das Maskottchen von Camping Schorni', label: 'Logo-Alternativtext' },
    marke:     { type: 'text',  default: 'Camping Schorni',               label: 'Markenname' },
    claim:     { type: 'text',  default: 'Sauberes Wasser im Wohnmobil',  label: 'Kurzer Claim unter der Marke' },
    telefon:   { type: 'text',  default: '{{facts.telefon}}',             label: 'Telefon (aus den Fakten)' },
    shopLabel: { type: 'text',  default: 'Zum Shop',                      label: 'Shop-Knopf' },
    shopHref:  { type: 'text',  default: '{{facts.shopUrl}}',             label: 'Shop-Ziel (aus den Fakten)' },
  },
  css: `
    .nav { position: sticky; top: 0; z-index: 10; background: var(--grund);
      border-bottom: 1px solid var(--grund-3); }
    .nav__zeile { display: flex; align-items: center; gap: 14px 28px; flex-wrap: wrap;
      padding-block: 12px; }
    .nav__marke { display: flex; align-items: center; gap: 12px; text-decoration: none;
      color: var(--handlung); }
    .nav__logo { width: 48px; height: 48px; flex: none; }
    .nav__wort { font-family: var(--font-display); font-weight: 800; font-size: 20px;
      letter-spacing: -.02em; line-height: 1.1; }
    .nav__wort small { display: block; font-family: var(--font-body); font-weight: 500;
      font-size: 12px; color: var(--text-muted); letter-spacing: 0; margin-top: 2px; }
    .nav__menue { display: flex; gap: 20px; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
    .nav__menue a { color: var(--text); text-decoration: none; font-weight: 500; }
    /* Zweite Ebene (3.2): am Desktop ein Aufklappmenü unter dem Hauptpunkt; auf dem Telefon führt
       der Hauptpunkt zur Seite, die die Unterpunkte auflistet (Übersicht, Stufe 6). */
    .nav__punkt { position: relative; }
    .nav__punkt--unter > a::after { content: " ▾"; font-size: .75em; color: var(--text-muted); }
    .nav__unter { display: none; position: absolute; left: -14px; top: 100%; z-index: 5; margin: 0; padding: 8px 0;
      list-style: none; min-width: 220px; background: var(--grund-2); border: 1px solid var(--grund-3);
      border-radius: var(--radius); box-shadow: 0 12px 28px rgba(0, 0, 0, .08); }
    .nav__unter a { display: block; padding: 8px 16px; white-space: nowrap; }
    .nav__punkt:hover > .nav__unter, .nav__punkt:focus-within > .nav__unter { display: block; }
    @media (max-width: 799px) { .nav__unter { display: none !important; } .nav__punkt--unter > a::after { content: ""; } }
    .nav__rechts { margin-left: auto; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .nav__telefon { color: var(--text-muted); text-decoration: none; font-size: 15px; white-space: nowrap; }
    .nav__shop { display: inline-block; padding: 10px 18px; border-radius: 999px;
      background: var(--handlung); color: var(--handlung-text); font-weight: 700;
      text-decoration: none; font-size: 15px; white-space: nowrap; }
  `,
  render(data) {
    const baum = Array.isArray(data.baum) ? data.baum : [];
    const punkte = baum.map((p) => {
      const kinder = (Array.isArray(p.kinder) ? p.kinder : []).filter((k) => ziel(k.href));
      const unter = kinder.map((k) => html`<li><a href="${raw(escapeAttr(ziel(k.href)))}">${k.label}</a></li>`);
      return html`<li class="${kinder.length ? 'nav__punkt nav__punkt--unter' : 'nav__punkt'}"><a href="${raw(escapeAttr(ziel(p.href)))}">${p.label}</a>${kinder.length ? html`<ul class="nav__unter">${reihe(unter, '')}</ul>` : ''}</li>`;
    });
    const telHref = ziel(`tel:${String(data.telefon || '').replace(/[^\d+]/g, '')}`);
    const logo = ziel(data.logo);
    return html`
      <header class="nav"><div class="container nav__zeile">
        <a class="nav__marke" href="/">
          ${logo ? html`<img class="nav__logo" src="${raw(escapeAttr(logo))}" alt="${data.logoAlt}" width="48" height="48">` : ''}
          <span class="nav__wort">${data.marke}${data.claim ? html`<small>${data.claim}</small>` : ''}</span>
        </a>
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
