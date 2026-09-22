/**
 * Benachrichtigung bei einer Anfrage (3.7): ZUERST speichern, DANN diese Mail. Sie läuft nur,
 * wenn SMTP_URL und MAIL_TO gesetzt sind — sonst liegt die Anfrage still im Cockpit. Der
 * Transport ist austauschbar; Tests schicken nichts ins Netz.
 */
export const mailKonfiguriert = () => Boolean(process.env.SMTP_URL && process.env.MAIL_TO);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reine Funktion: aus der gespeicherten Anfrage die Mail. */
export function baueMail(anfrage, { site = {}, basis = '', an = process.env.MAIL_TO, von = process.env.MAIL_FROM } = {}) {
  const daten = Object.entries(anfrage.daten || {}).filter(([k]) => !k.startsWith('_'));
  const zeilen = daten.map(([k, v]) => `${k}: ${String(v ?? '').replace(/\r?\n/g, '\n   ')}`).join('\n');
  const absender = daten.find(([k]) => /e-?mail/i.test(k))?.[1];
  const wann = new Date(anfrage.created_at || Date.now()).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' });
  return {
    from: von || an,
    to: an,
    ...(absender && EMAIL.test(String(absender)) ? { replyTo: String(absender) } : {}),
    subject: `Neue Anfrage über ${site.name || 'die Website'}${anfrage.page_slug ? ` (/${anfrage.page_slug}/)` : ''}`,
    text: `Neue Anfrage (${anfrage.form || 'Formular'}) vom ${wann}\n\n${zeilen}\n\n${basis ? `Im Cockpit: ${basis}/admin/#/anfragen\n` : ''}`,
  };
}

/** Schickt die Mail, wenn Versand eingerichtet ist. Gibt zurück, ob etwas verschickt wurde. */
export async function benachrichtige(anfrage, { site, basis, transport } = {}) {
  if (!transport && !mailKonfiguriert()) {
    console.log(`[Motor] Anfrage ${anfrage.id} gespeichert (Mailversand nicht eingerichtet: SMTP_URL und MAIL_TO fehlen)`);
    return false;
  }
  const t = transport || (await import('nodemailer')).default.createTransport(process.env.SMTP_URL);
  await t.sendMail(baueMail(anfrage, { site, basis }));
  return true;
}
