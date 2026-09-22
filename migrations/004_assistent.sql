-- Stufe 7: der Assistent. Läuft auf SQLite und Postgres.
-- Stücke: jede veröffentlichte Seite wird in Absätze zerlegt (src/assistent.js, zerlege).
-- Ein Stück trägt immer seinen Slug — sonst kann die Antwort nicht auf die Quelle zeigen.
CREATE TABLE IF NOT EXISTS chunks (
  id           TEXT PRIMARY KEY,
  page_slug    TEXT NOT NULL,
  ueberschrift TEXT,
  text         TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chunks_page ON chunks (page_slug);
-- Was gefragt wurde, ohne IP-Adresse: damit der Mensch sieht, was fehlt.
CREATE TABLE IF NOT EXISTS chat_log (
  id         TEXT PRIMARY KEY,
  frage      TEXT NOT NULL,
  antwort    TEXT,
  quellen    TEXT,
  gewusst    INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
-- Nicht jede Seite gehört in den Index. Vorgabe: alles drin, der Mensch nimmt heraus.
ALTER TABLE pages ADD COLUMN chat_excluded INTEGER NOT NULL DEFAULT 0;
