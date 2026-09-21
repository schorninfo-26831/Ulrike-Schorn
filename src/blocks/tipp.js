import { html, raw, escapeAttr, ziel, markdownInline } from './_util.js';

/**
 * Schorni's Tipp — das Markenformat: Schorni im Mint-Kreis, daneben eine Sprechblase
 * mit genau einem Handgriff aus der Praxis. Ein Tipp pro Seite; ohne Substanz bleibt
 * der Baustein weg.
 */
export default {
  name: 'tipp',
  label: "Schorni's Tipp",
  schema: {
    titel:   { type: 'text',     default: "Schorni's Tipp", label: 'Titel der Sprechblase' },
    text:    { type: 'longtext', default: '', label: 'Der eine Tipp' },
    bild:    { type: 'image',    default: '/img/schorni-logo.png', label: 'Bild' },
    bildAlt: { type: 'text',     default: 'Schorni zeigt mit dem Daumen nach oben', label: 'Bild-Alternativtext' },
  },
  css: `
    .tipp { padding-block: 8px 56px; }
    .tipp__box { display: flex; gap: 22px; align-items: center; flex-wrap: wrap; }
    .tipp__bild { flex: none; width: 128px; height: 128px; border-radius: 50%;
      background: var(--mint); display: grid; place-items: center; overflow: hidden; }
    .tipp__bild img { width: 112px; height: 112px; display: block; margin-top: 10px; }
    .tipp__blase { position: relative; flex: 1 1 320px; min-width: 0; background: #fff;
      border: 1px solid var(--grund-3); border-radius: var(--radius); padding: 20px 24px; }
    .tipp__blase::before { content: ''; position: absolute; left: -9px; top: 50%; width: 16px; height: 16px;
      background: #fff; border-left: 1px solid var(--grund-3); border-bottom: 1px solid var(--grund-3);
      transform: translateY(-50%) rotate(45deg); }
    .tipp__titel { font-family: var(--font-mono); font-size: 12px; letter-spacing: .12em;
      text-transform: uppercase; color: var(--signal); margin: 0 0 6px; }
    .tipp__text { margin: 0; font-size: 17px; }
    .tipp__text strong { color: var(--handlung); }
    @media (max-width: 560px) {
      .tipp__blase::before { left: 28px; top: -9px; transform: rotate(135deg); }
    }
  `,
  render(data) {
    if (!data.text) return '';
    const bild = ziel(data.bild);
    return html`
      <section class="section tipp"><div class="container">
        <div class="tipp__box">
          ${bild ? html`<div class="tipp__bild"><img src="${raw(escapeAttr(bild))}" alt="${data.bildAlt}" width="112" height="112"></div>` : ''}
          <div class="tipp__blase">
            <p class="tipp__titel">${data.titel}</p>
            <p class="tipp__text">${markdownInline(data.text)}</p>
          </div>
        </div>
      </div></section>`;
  },
};
