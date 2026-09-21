import 'dotenv/config';
import express from 'express';
import { runMigrations, queryOne } from './src/db.js';
import { renderPage } from './src/renderer.js';

await runMigrations();
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public', { maxAge: '7d' }));
app.use('/uploads', express.static('data/uploads', { maxAge: '7d' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Öffentliche Seiten: Slug → veröffentlichte Seite → HTML. Mit und ohne Schrägstrich.
app.get(/^\/(.*)$/, async (req, res, next) => {
  try {
    const slug = (req.params[0] || 'start').replace(/\/+$/, '') || 'start';
    const page = await queryOne(
      "SELECT * FROM pages WHERE slug = $1 AND status = 'published'", [slug]);
    if (!page) return next();
    res.type('html').send(renderPage(page));
  } catch (err) { next(err); }
});

app.use((_req, res) => res.status(404).type('html').send('<h1>Nicht gefunden</h1>'));

app.listen(process.env.PORT || 3000,
  () => console.log(`[Motor] läuft auf http://localhost:${process.env.PORT || 3000}`));
