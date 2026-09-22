/**
 * Datensparsames Analytics (Stufe 5, P6): je Tag und Adresse eine Zahl. Keine IP-Adresse,
 * kein Cookie, keine Browserkennung — also nichts, was ein Banner bräuchte. Bekannte Bots
 * zählen nicht. Das Zählen läuft neben der Auslieferung her und darf sie nie aufhalten.
 */
import { query } from './db.js';
import { istBot } from './oeffentlich.js';

export const tag = (d = new Date()) => d.toISOString().slice(0, 10);

export function zaehle(pfad, userAgent, heute = tag()) {
  if (istBot(userAgent)) return;
  query(
    `INSERT INTO zugriffe (tag, pfad, anzahl) VALUES ($1, $2, 1)
     ON CONFLICT (tag, pfad) DO UPDATE SET anzahl = zugriffe.anzahl + 1`,
    [heute, pfad],
  ).catch((err) => console.error(`[Motor] [WARN] Zählen: ${err.message}`));
}

/** Fürs Cockpit: Summen je Tag und je Adresse über die letzten `tage` Tage. */
export async function statistik(tage = 30) {
  const n = Math.min(Math.max(Number(tage) || 30, 1), 365);
  const seit = tag(new Date(Date.now() - (n - 1) * 86400000));
  const proTag = (await query('SELECT tag, SUM(anzahl) AS anzahl FROM zugriffe WHERE tag >= $1 GROUP BY tag ORDER BY tag DESC', [seit]))
    .map((r) => ({ tag: r.tag, anzahl: Number(r.anzahl) }));
  const proPfad = (await query('SELECT pfad, SUM(anzahl) AS anzahl FROM zugriffe WHERE tag >= $1 GROUP BY pfad ORDER BY SUM(anzahl) DESC LIMIT 100', [seit]))
    .map((r) => ({ pfad: r.pfad, anzahl: Number(r.anzahl) }));
  return { seit, tage: n, gesamt: proTag.reduce((s, r) => s + r.anzahl, 0), proTag, proPfad };
}
