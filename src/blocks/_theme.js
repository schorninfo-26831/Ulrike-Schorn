import { loadTheme } from '../config.js';

/**
 * Tokens aus config/theme.json → CSS-Variablen plus das Grundgerüst, das jeder
 * Baustein voraussetzt. Farben und Schriften stehen NUR hier als Variable —
 * ein Redesign ist damit eine Datei, keine Suchen-und-Ersetzen-Orgie.
 *
 * Schriften: selbst gehostet aus public/fonts. Kein Aufruf eines fremden Dienstes,
 * keine IP-Adresse eines Besuchers verlässt dafür die Seite.
 */
export function themeCss() {
  const t = loadTheme();
  const vars = [
    ...Object.entries(t.farben || {}).map(([k, v]) => `--${k}: ${v};`),
    ...Object.entries(t.schriften || {}).map(([k, v]) => `--font-${k}: ${v};`),
    ...Object.entries(t.masse || {}).map(([k, v]) => `--${k}: ${v};`),
  ].join(' ');

  const faces = (t.schriftdateien || []).map((f) => `
    @font-face { font-family: '${f.familie}'; font-style: normal; font-weight: ${f.gewicht};
      font-display: swap; src: url('${f.datei}') format('woff2'); }`).join('');

  return `${faces}
    :root { ${vars} }
    *, *::before, *::after { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
    body { margin: 0; background: var(--grund); color: var(--text);
      font-family: var(--font-body); font-size: 17px; line-height: 1.6;
      -webkit-font-smoothing: antialiased; }
    h1, h2, h3 { font-family: var(--font-display); font-weight: 800; letter-spacing: -.02em;
      line-height: 1.15; margin: 0; text-wrap: balance; }
    p { margin: 0 0 1em; }
    a { color: var(--handlung); }
    img { max-width: 100%; height: auto; }
    .container { max-width: var(--container); margin: 0 auto; padding-left: 20px; padding-right: 20px; }
    .section { padding-block: var(--abstand-section); }
    .eyebrow { font-family: var(--font-mono); font-size: 12px; letter-spacing: .12em;
      text-transform: uppercase; color: var(--signal); margin: 0 0 10px; }
    a:focus-visible { outline: 3px solid var(--signal); outline-offset: 3px; border-radius: 4px; }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { transition: none !important; animation: none !important; }
    }
  `;
}
