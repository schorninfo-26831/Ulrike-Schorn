import { html, raw, reihe, escapeAttr, ziel } from './_util.js';

/**
 * Fußzeile. Anschrift und Kontakt kommen aus den Fakten (P2) — fehlt ein Wert,
 * steht sichtbar […] auf der Seite. Die Rechtsseiten sind site-relativ verlinkt.
 */
export default {
  name: 'footer',
  label: 'Fußzeile',
  schema: {
    marke:     { type: 'text', default: 'Camping Schorni', label: 'Markenname' },
    inhaberin: { type: 'text', default: 'Inhaberin: {{facts.inhaberin}}', label: 'Inhaberin (aus den Fakten)' },
    adresse:   { type: 'text', default: '{{facts.anschrift.strasse}} · {{facts.anschrift.plz}} {{facts.anschrift.ort}}', label: 'Anschrift (aus den Fakten)' },
    telefon:   { type: 'text', default: '{{facts.telefon}}', label: 'Telefon (aus den Fakten)' },
    email:     { type: 'text', default: '{{facts.email}}',   label: 'E-Mail (aus den Fakten)' },
    hinweis:   { type: 'text', default: 'Produkte, Preise und Bestellung findest du im Shop.', label: 'Hinweiszeile' },
    shopHref:  { type: 'text', default: '{{facts.shopUrl}}', label: 'Shop-Ziel (aus den Fakten)' },
  },
  css: `
    .footer { border-top: 1px solid var(--grund-3); padding-block: 40px 48px; font-size: 15px;
      color: var(--text-muted); }
    .footer__zeile { display: flex; flex-wrap: wrap; gap: 24px 48px; }
    .footer__spalte { flex: 1 1 220px; min-width: 0; }
    .footer__marke { font-family: var(--font-display); font-weight: 800; color: var(--handlung);
      font-size: 17px; margin-bottom: 6px; }
    .footer p { margin: 0 0 4px; }
    .footer a { color: var(--handlung); text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .footer__recht { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 14px; }
  `,
  render(data) {
    const tel = ziel(`tel:${String(data.telefon || '').replace(/[^\d+]/g, '')}`);
    const mail = ziel(`mailto:${String(data.email || '')}`);
    const shop = ziel(data.shopHref);
    const recht = [
      html`<li><a href="/impressum/">Impressum</a></li>`,
      html`<li><a href="/datenschutz/">Datenschutz</a></li>`,
    ];
    return html`
      <footer class="footer"><div class="container footer__zeile">
        <div class="footer__spalte">
          <p class="footer__marke">${data.marke}</p>
          <p>${data.inhaberin}</p>
          <p>${data.adresse}</p>
        </div>
        <div class="footer__spalte">
          ${data.telefon && tel ? html`<p>Telefon: <a href="${raw(escapeAttr(tel))}">${data.telefon}</a></p>` : ''}
          ${data.email && mail ? html`<p>E-Mail: <a href="${raw(escapeAttr(mail))}">${data.email}</a></p>` : ''}
          ${data.hinweis ? html`<p>${data.hinweis}${shop ? html` <a href="${raw(escapeAttr(shop))}">Zum Shop</a>` : ''}</p>` : ''}
        </div>
        <div class="footer__spalte">
          <ul class="footer__recht">${reihe(recht, '')}</ul>
        </div>
      </div></footer>`;
  },
};
