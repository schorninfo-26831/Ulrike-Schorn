import { html, raw, escapeAttr, ziel } from './_util.js';

/**
 * Ein Bild im Inhalt. Alt-Text ist Pflicht (3.3): ohne ihn ist das Bild für einen
 * Vorleser nicht vorhanden — und für den Renderer auch nicht.
 */
export default {
  name: 'bild',
  label: 'Bild',
  schema: {
    src:          { type: 'image', default: '', label: 'Bild (aus den Medien wählen)' },
    alt:          { type: 'text',  default: '', label: 'Alternativtext — Pflicht' },
    unterschrift: { type: 'text',  default: '', label: 'Bildunterschrift (optional; bei KI-Bildern: „Bild KI-gestützt erstellt")' },
    breite:       { type: 'select', default: 'normal', label: 'Breite',
                    optionen: [{ value: 'normal', label: 'Normal' }, { value: 'schmal', label: 'Schmal' }] },
  },
  css: `
    .bild figure { margin: 0; }
    .bild--schmal figure { max-width: 560px; }
    .bild img { display: block; width: 100%; height: auto; border-radius: var(--radius); }
    .bild figcaption { font-size: 14px; color: var(--text-muted); margin-top: 10px; }
  `,
  pruefe(data) {
    return data.src && !String(data.alt || '').trim() ? ['Bild ohne Alternativtext'] : [];
  },
  render(data) {
    const src = ziel(data.src);
    if (!src || !String(data.alt || '').trim()) return '';
    return html`
      <section class="section bild ${data.breite === 'schmal' ? 'bild--schmal' : ''}"><div class="container">
        <figure>
          <img src="${raw(escapeAttr(src))}" alt="${data.alt}" loading="lazy">
          ${data.unterschrift ? html`<figcaption>${data.unterschrift}</figcaption>` : ''}
        </figure>
      </div></section>`;
  },
};
