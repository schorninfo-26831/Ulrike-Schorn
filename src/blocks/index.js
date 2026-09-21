import nav from './nav.js';
import hero from './hero.js';
import cards from './cards.js';
import tipp from './tipp.js';
import hinweis from './hinweis.js';
import richtext from './richtext.js';
import bild from './bild.js';
import form from './form.js';
import cta from './cta.js';
import footer from './footer.js';

/** Registry: type → Baustein. Ein neuer Baustein ist ein Import und eine Zeile hier. */
export const blocks = Object.fromEntries(
  [nav, hero, cards, tipp, hinweis, richtext, bild, form, cta, footer].map((b) => [b.name, b]));

/** Prüfungen einzelner Bausteine (z. B. Bild ohne Alt-Text). Für das Cockpit und den Generator. */
export function pruefeBloecke(liste) {
  const fehler = [];
  for (const [i, b] of (liste || []).entries()) {
    const block = blocks[b?.type];
    if (block?.pruefe) for (const f of block.pruefe(b.data || {})) fehler.push(`Baustein ${i + 1} (${block.label}): ${f}`);
  }
  return fehler;
}
