import 'dotenv/config';
import express from 'express';
import { readFileSync } from 'node:fs';
import { runMigrations } from './src/db.js';
import { apiRouter } from './src/routes/api.js';
import { publicRouter } from './src/routes/public.js';

await runMigrations();
const VERSION = JSON.parse(readFileSync('package.json', 'utf8')).version;
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.static('public', { maxAge: '7d' }));
app.use('/uploads', express.static('data/uploads', { maxAge: '7d' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', version: VERSION }));

// Das Cockpit: HTML mit no-store und Versionsstempel an jedem Skript — sonst sieht der
// Mensch nach dem nächsten Bau die alte Oberfläche (Falle aus Stufe 3).
app.get(['/admin', '/admin/'], (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(readFileSync('admin/index.html', 'utf8').replaceAll('{{VERSION}}', VERSION));
});
app.use('/admin', express.static('admin', { index: false, etag: false, maxAge: 0 }));

app.use('/api', apiRouter);
app.use(publicRouter);

app.use((_req, res) => res.status(404).type('html').send('<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Nicht gefunden</title></head><body style="font-family:system-ui;padding:40px"><h1>Nicht gefunden</h1><p><a href="/">Zur Startseite</a></p></body></html>'));

app.use((err, _req, res, _next) => {
  console.error(`[Motor] [ERROR] ${err.stack || err}`);
  res.status(500).json({ error: 'Interner Fehler' });
});

app.listen(process.env.PORT || 3000,
  () => console.log(`[Motor] v${VERSION} läuft auf http://localhost:${process.env.PORT || 3000} · Cockpit: /admin/`));
