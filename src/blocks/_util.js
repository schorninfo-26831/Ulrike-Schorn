/**
 * Die Sicherheitsschicht. Alles, was ein Baustein ausgibt, läuft hier durch.
 * Das ist die Stelle, an der ein Modell-Text nicht zum Sicherheitsloch wird.
 */
export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export const escapeAttr = escapeHtml;

/** Markiert Zeichenketten, die schon sicher sind. */
export const raw = (v) => ({ __raw: true, value: v ?? '' });

/** html`…` escaped alles Eingesetzte, außer es ist raw(). */
export function html(teile, ...werte) {
  let out = '';
  teile.forEach((t, i) => {
    out += t;
    const v = werte[i];
    if (v == null) return;
    out += v && typeof v === 'object' && v.__raw ? v.value : escapeHtml(v);
  });
  return raw(out);
}

/** Mehrere raw()-Stücke zu einem zusammenfügen — html`` kennt keine Arrays. */
export const reihe = (teile, trenner = '\n') => raw(teile.map((t) => (t?.__raw ? t.value : escapeHtml(t))).join(trenner));

/**
 * Ziele: nur site-relativ, https, Anker, tel: oder mailto:. Nie javascript: oder data:.
 * (tel: und mailto: sind gegenüber der Anleitung ergänzt — beide sind harmlos und für
 * Telefon und E-Mail aus den Fakten nötig.)
 */
export const ziel = (href) => (/^(\/(?!\/)|https:\/\/|#|tel:|mailto:)/.test(String(href || '').trim()) ? String(href).trim() : '');

/** Absätze: an Leerzeilen trennen. */
export const absaetze = (text) => String(text ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/**
 * Markdown-inline, bewusst winzig: **fett**, *kursiv*, [Text](Ziel).
 * Erst escapen, dann ersetzen — so kann kein Markup aus dem Modell durchrutschen.
 */
export function markdownInline(text) {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => {
    const z = ziel(h);
    return z ? `<a href="${escapeAttr(z)}">${t}</a>` : t;
  });
  return raw(s);
}
