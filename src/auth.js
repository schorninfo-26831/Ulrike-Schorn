/**
 * Anmeldung fürs Cockpit. Passwort nur aus der Umgebung (ADMIN_PASSWORD), nie im Code.
 * Sitzungen leben im Speicher — nach einem Neustart meldet man sich neu an. Für Weg B
 * mit mehreren Instanzen wandert die Sitzung in eine Tabelle; die Schnittstelle bleibt.
 */
import { randomBytes, timingSafeEqual } from 'node:crypto';

const sitzungen = new Map(); // token → angelegt (ms)
const GUELTIG_MS = 12 * 60 * 60 * 1000;
export const COOKIE = 'motor_session';

export function parseCookies(header = '') {
  return Object.fromEntries(String(header).split(';').map((s) => s.trim()).filter(Boolean).map((s) => {
    const i = s.indexOf('=');
    return i < 0 ? [s, ''] : [decodeURIComponent(s.slice(0, i)), decodeURIComponent(s.slice(i + 1))];
  }));
}

export function passwortKonfiguriert() { return Boolean(process.env.ADMIN_PASSWORD); }

export function passwortStimmt(eingabe) {
  const soll = process.env.ADMIN_PASSWORD || '';
  if (!soll) return false;
  const a = Buffer.from(String(eingabe ?? '')); const b = Buffer.from(soll);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function neueSitzung() {
  const t = randomBytes(32).toString('hex');
  sitzungen.set(t, Date.now());
  return t;
}

export function sitzungGueltig(t) {
  if (!t || !sitzungen.has(t)) return false;
  if (Date.now() - sitzungen.get(t) > GUELTIG_MS) { sitzungen.delete(t); return false; }
  return true;
}

export function sitzungBeenden(t) { sitzungen.delete(t); }

/** Middleware: alles dahinter verlangt eine gültige Sitzung. */
export function anmeldungNoetig(req, res, next) {
  const t = parseCookies(req.headers.cookie)[COOKIE];
  if (sitzungGueltig(t)) return next();
  res.status(401).json({ error: 'Anmeldung nötig' });
}

export function cookieSetzen(res, token, req) {
  const sicher = req.secure || req.get('x-forwarded-proto') === 'https';
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: sicher, path: '/', maxAge: GUELTIG_MS });
}
