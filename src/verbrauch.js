/**
 * Verbrauchsbuch (Stufe 4 und 7): jeder Generator-Lauf und jede Antwort des Assistenten als eine
 * Zeile mit Token und Dollar, ohne Inhalt und ohne IP. Daraus zeigt das Cockpit Summen in Euro.
 * Der Dollarbetrag wird beim Eintrag festgehalten, der Euro-Kurs beim Anzeigen angewandt.
 */
import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { loadKosten } from './config.js';
import { berechne, beschreibe } from './kosten.js';

const n = (x) => Number(x) || 0;

export async function protokolliereVerbrauch(art, verbrauch) {
  if (!verbrauch) return;
  const k = berechne(verbrauch);
  await query(
    `INSERT INTO ki_verbrauch (id, art, modell, eingabe, ausgabe, cache_lesen, cache_schreiben, usd, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [randomUUID(), art, verbrauch.modell || null, n(verbrauch.eingabe), n(verbrauch.ausgabe), n(verbrauch.cache), n(verbrauch.cacheSchreiben), k ? k.usd : null, new Date().toISOString()],
  );
}

/** Fürs Cockpit: je Art (generator, assistent) Anzahl, Token und Euro, für den laufenden Monat und gesamt. */
export async function verbrauchSummen(cfg = loadKosten()) {
  const kurs = cfg.usdEur || 1;
  const leer = () => ({ anzahl: 0, hinein: 0, heraus: 0, eur: 0, text: '0,00 €' });
  const lade = async (seit) => {
    const zeilen = await query(
      'SELECT art, COUNT(*) AS n, SUM(eingabe + cache_lesen + cache_schreiben) AS hinein, SUM(ausgabe) AS heraus, SUM(usd) AS usd FROM ki_verbrauch WHERE created_at >= $1 GROUP BY art',
      [seit],
    );
    const aus = { generator: leer(), assistent: leer() };
    for (const z of zeilen) {
      const eur = n(z.usd) * kurs;
      aus[z.art] = { anzahl: n(z.n), hinein: n(z.hinein), heraus: n(z.heraus), eur, text: n(z.n) ? beschreibe(eur) : '0,00 €' };
    }
    return aus;
  };
  const monatAb = new Date().toISOString().slice(0, 7) + '-01';
  return { stand: cfg.stand || null, usdEur: kurs, monat: { seit: monatAb, ...(await lade(monatAb)) }, gesamt: await lade('0') };
}
