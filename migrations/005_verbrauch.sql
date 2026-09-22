-- Verbrauchsbuch: ein Eintrag je Generator-Lauf und je Antwort des Assistenten, ohne Inhalt, ohne IP.
-- Dollar wird beim Eintrag festgehalten (Preisliste in config/kosten.json), Euro rechnet das Cockpit.
CREATE TABLE IF NOT EXISTS ki_verbrauch (
  id              TEXT PRIMARY KEY,
  art             TEXT NOT NULL,
  modell          TEXT,
  eingabe         INTEGER NOT NULL DEFAULT 0,
  ausgabe         INTEGER NOT NULL DEFAULT 0,
  cache_lesen     INTEGER NOT NULL DEFAULT 0,
  cache_schreiben INTEGER NOT NULL DEFAULT 0,
  usd             REAL,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ki_verbrauch_zeit ON ki_verbrauch (created_at);
