/**
 * Was eine Website braucht, sobald sie öffentlich ist (Stufe 5): Sicherheits-Kopfzeilen,
 * eine Bremse gegen Passwort-Raten, Bot-Erkennung fürs Zählen und die absolute Basisadresse.
 * Alles hier läuft ohne Datenbank und ohne Netz — deshalb ist es testbar.
 */

/** Kopfzeilen, die ein Reverse-Proxy nicht von allein setzt. HSTS nur über HTTPS. */
export function sicherheitsKopfzeilen(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000');
  next();
}

/**
 * Bremse gegen Passwort-Raten: nach `versuche` Fehlversuchen je Absender ist für ein Zeitfenster
 * Schluss. Lebt im Speicher wie die Sitzungen — ein Neustart setzt sie zurück, das reicht.
 */
export class Anmeldebremse {
  constructor({ versuche = 10, fensterMs = 15 * 60 * 1000 } = {}) {
    this.versuche = versuche;
    this.fensterMs = fensterMs;
    this.eintraege = new Map();
  }

  #eintrag(wer, jetzt) {
    if (this.eintraege.size > 5000) {
      for (const [k, e] of this.eintraege) if (jetzt - e.seit > this.fensterMs) this.eintraege.delete(k);
    }
    const e = this.eintraege.get(wer);
    if (e && jetzt - e.seit <= this.fensterMs) return e;
    const neu = { seit: jetzt, fehl: 0 };
    this.eintraege.set(wer, neu);
    return neu;
  }

  gesperrt(wer, jetzt = Date.now()) { return this.#eintrag(wer, jetzt).fehl >= this.versuche; }
  fehlversuch(wer, jetzt = Date.now()) { this.#eintrag(wer, jetzt).fehl += 1; }
  erfolg(wer) { this.eintraege.delete(wer); }
  wartezeitSek(wer, jetzt = Date.now()) {
    const e = this.eintraege.get(wer);
    return e ? Math.max(0, Math.ceil((e.seit + this.fensterMs - jetzt) / 1000)) : 0;
  }
}

/** Grobe Bot-Erkennung fürs Zählen: lieber einen Menschen zu wenig als einen Crawler zu viel. */
export function istBot(userAgent) {
  const ua = String(userAgent || '');
  if (!ua) return true;
  if (/^(node|undici|axios|okhttp|go-http-client|libwww|http_request|ruby)\b/i.test(ua)) return true; // Programme, keine Browser
  return /bot|crawl|spider|slurp|fetch|preview|headless|curl|wget|python|java\/|monitor|lighthouse|pingdom|facebookexternalhit|whatsapp|telegram|discord|slack|skype/i.test(ua);
}

/** Absolute Basisadresse: die feste Domain aus site.json, sonst das, was der Aufruf mitbringt. */
export function basisUrl(site, req) {
  const dom = String(site?.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (dom) return `https://${dom}`;
  if (!req) return '';
  return `${req.protocol}://${req.get('host')}`.replace(/\/+$/, '');
}

/** TRUST_PROXY aus der Umgebung: true/false, eine Zahl (Hops) oder eine Liste von Adressen. */
export function trustProxy(wert = process.env.TRUST_PROXY) {
  const w = String(wert ?? '').trim();
  if (!w) return 'loopback, linklocal, uniquelocal';
  if (w === 'true') return true;
  if (w === 'false') return false;
  if (/^\d+$/.test(w)) return Number(w);
  return w;
}
