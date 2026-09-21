import nav from './nav.js';
import hero from './hero.js';
import richtext from './richtext.js';
import cta from './cta.js';
import footer from './footer.js';

/** Registry: type → Baustein. Ein neuer Baustein ist ein Import und eine Zeile hier. */
export const blocks = Object.fromEntries(
  [nav, hero, richtext, cta, footer].map((b) => [b.name, b]));
