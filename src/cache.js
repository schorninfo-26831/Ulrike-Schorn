/**
 * Render-Cache im Speicher, je Slug. Jede Änderung im Cockpit leert ihn ganz — bei
 * ein paar Dutzend Seiten ist Neurendern billiger als Buchhaltung darüber, wer wen
 * auflistet. Teil III, Punkt 2: Bei zwei Instanzen hat jede ihren eigenen Cache;
 * dann bekommen Seiten, die fremde Seiten auflisten, eine kurze Frist.
 */
const speicher = new Map();
const FRIST_MS = 60 * 1000;

export const cache = {
  get(slug) {
    const e = speicher.get(slug);
    if (!e) return null;
    if (Date.now() - e.zeit > FRIST_MS) { speicher.delete(slug); return null; }
    return e.html;
  },
  set(slug, html) { speicher.set(slug, { html, zeit: Date.now() }); },
  clear() { speicher.clear(); },
  size() { return speicher.size; },
};
