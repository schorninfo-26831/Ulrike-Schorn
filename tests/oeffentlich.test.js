// Stufe 5 — öffentlich. Läuft ohne Datenbank, ohne Netz, ohne Schlüssel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sicherheitsKopfzeilen, Anmeldebremse, istBot, basisUrl, trustProxy } from '../src/oeffentlich.js';
import { baueMail, benachrichtige, mailKonfiguriert } from '../src/mail.js';
import { renderPage } from '../src/renderer.js';

const res = () => { const k = {}; return { k, set: (a, b) => { k[a] = b; } }; };

test('Sicherheits-Kopfzeilen: immer nosniff & Co., HSTS nur über HTTPS', () => {
  const r1 = res(); let weiter = 0;
  sicherheitsKopfzeilen({ secure: false }, r1, () => { weiter++; });
  assert.equal(r1.k['X-Content-Type-Options'], 'nosniff');
  assert.equal(r1.k['X-Frame-Options'], 'SAMEORIGIN');
  assert.ok(!('Strict-Transport-Security' in r1.k));
  const r2 = res();
  sicherheitsKopfzeilen({ secure: true }, r2, () => { weiter++; });
  assert.match(r2.k['Strict-Transport-Security'], /max-age/);
  assert.equal(weiter, 2);
});

test('Anmeldebremse: zehn Fehlversuche sperren, Erfolg löscht, das Fenster läuft ab', () => {
  const b = new Anmeldebremse({ versuche: 3, fensterMs: 1000 });
  const t0 = 1_000_000;
  assert.equal(b.gesperrt('a', t0), false);
  b.fehlversuch('a', t0); b.fehlversuch('a', t0 + 1);
  assert.equal(b.gesperrt('a', t0 + 2), false);
  b.fehlversuch('a', t0 + 3);
  assert.equal(b.gesperrt('a', t0 + 4), true);
  assert.equal(b.gesperrt('b', t0 + 4), false, 'ein anderer Absender ist frei');
  assert.ok(b.wartezeitSek('a', t0 + 4) >= 1);
  assert.equal(b.gesperrt('a', t0 + 1001), false, 'nach dem Fenster wieder frei');
  b.fehlversuch('a', t0 + 2000); b.erfolg('a');
  assert.equal(b.wartezeitSek('a', t0 + 2001), 0);
});

test('Bot-Erkennung: Crawler, leere Kennung und Werkzeuge ja, ein Browser nein', () => {
  assert.equal(istBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
  assert.equal(istBot(''), true);
  assert.equal(istBot('curl/8.4.0'), true);
  assert.equal(istBot('node'), true, 'Node-eigenes fetch ist kein Browser');
  assert.equal(istBot('axios/1.7.2'), true);
  assert.equal(istBot('Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120'), true);
  assert.equal(istBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'), false);
  assert.equal(istBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'), false);
});

test('Basisadresse: feste Domain gewinnt, sonst der Aufruf, sonst leer', () => {
  const req = { protocol: 'https', get: (h) => (h === 'host' ? 'xyz.trycloudflare.com' : '') };
  assert.equal(basisUrl({ domain: 'inhalte.camping-schorni.de' }, req), 'https://inhalte.camping-schorni.de');
  assert.equal(basisUrl({ domain: 'https://inhalte.camping-schorni.de/' }, req), 'https://inhalte.camping-schorni.de');
  assert.equal(basisUrl({ domain: '' }, req), 'https://xyz.trycloudflare.com');
  assert.equal(basisUrl({ domain: '' }, null), '');
});

test('TRUST_PROXY: Standardliste, true/false, Zahl, eigene Liste', () => {
  assert.equal(trustProxy(''), 'loopback, linklocal, uniquelocal');
  assert.equal(trustProxy(undefined), 'loopback, linklocal, uniquelocal');
  assert.equal(trustProxy('true'), true);
  assert.equal(trustProxy('false'), false);
  assert.equal(trustProxy('2'), 2);
  assert.equal(trustProxy('10.0.0.1'), '10.0.0.1');
});

test('Mail: Betreff, Felder ohne interne Schlüssel, Antwort-Adresse nur wenn gültig', () => {
  const anfrage = { id: 'x', form: 'kontakt', page_slug: 'kontakt', created_at: '2026-09-22T08:00:00.000Z',
    daten: { name: 'Anna', email: 'anna@example.de', nachricht: 'Welcher Filter\npasst?', _seite: 'kontakt' } };
  const m = baueMail(anfrage, { site: { name: 'Camping Schorni' }, basis: 'https://x.de', an: 'info@example.de', von: '' });
  assert.equal(m.to, 'info@example.de');
  assert.equal(m.from, 'info@example.de', 'ohne MAIL_FROM geht der Absender an den Empfänger');
  assert.equal(m.replyTo, 'anna@example.de');
  assert.match(m.subject, /Camping Schorni \(\/kontakt\/\)/);
  assert.ok(m.text.includes('name: Anna') && m.text.includes('Welcher Filter') && m.text.includes('https://x.de/admin/#/anfragen'));
  assert.ok(!m.text.includes('_seite'));
  const m2 = baueMail({ daten: { email: 'kaputt\r\nBcc: boese@x.de' } }, { an: 'a@b.de' });
  assert.equal('replyTo' in m2, false);
});

test('Benachrichtigen: ohne Einrichtung still, mit Transport wird verschickt', async () => {
  const alt = { url: process.env.SMTP_URL, an: process.env.MAIL_TO };
  delete process.env.SMTP_URL; delete process.env.MAIL_TO;
  assert.equal(mailKonfiguriert(), false);
  assert.equal(await benachrichtige({ id: 'x', daten: {} }), false);
  const verschickt = [];
  const transport = { sendMail: async (m) => { verschickt.push(m); } };
  process.env.MAIL_TO = 'info@example.de';
  assert.equal(await benachrichtige({ id: 'y', form: 'kontakt', daten: { name: 'B' } }, { site: { name: 'S' }, transport }), true);
  assert.equal(verschickt.length, 1);
  assert.equal(verschickt[0].to, 'info@example.de');
  delete process.env.MAIL_TO;
  if (alt.url) process.env.SMTP_URL = alt.url;
  if (alt.an) process.env.MAIL_TO = alt.an;
});

test('Teilen: Standard-Vorschaubild, absolute Adressen mit Basis, canonical nur veröffentlicht', () => {
  const seite = (status, og) => ({ title: 'T', slug: 'wasser-ratgeber', status, og_image: og, content_json: { blocks: [] } });
  const ohne = renderPage(seite('published'));
  assert.ok(ohne.includes('<meta property="og:image" content="/img/og-standard.png">'));
  assert.ok(!ohne.includes('rel="canonical"'));
  const mit = renderPage(seite('published'), { basis: 'https://x.de' });
  assert.ok(mit.includes('<link rel="canonical" href="https://x.de/wasser-ratgeber/">'));
  assert.ok(mit.includes('<meta property="og:url" content="https://x.de/wasser-ratgeber/">'));
  assert.ok(mit.includes('<meta property="og:image" content="https://x.de/img/og-standard.png">'));
  assert.ok(mit.includes('og:site_name') && mit.includes('twitter:card'));
  const eigen = renderPage(seite('draft', '/uploads/abc.png'), { basis: 'https://x.de' });
  assert.ok(eigen.includes('content="https://x.de/uploads/abc.png"'));
  assert.ok(!eigen.includes('rel="canonical"'), 'Entwürfe bekommen kein canonical');
  const start = renderPage({ title: 'S', slug: 'start', status: 'published', content_json: { blocks: [] } }, { basis: 'https://x.de' });
  assert.ok(start.includes('<link rel="canonical" href="https://x.de/">'));
});
