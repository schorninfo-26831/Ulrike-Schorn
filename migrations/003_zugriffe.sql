-- Stufe 5: datensparsames Zählen. Je Tag und Adresse eine Zahl — keine IP, kein Cookie,
-- keine Browserkennung. Läuft auf SQLite und Postgres.
CREATE TABLE IF NOT EXISTS zugriffe (
  tag    TEXT    NOT NULL,
  pfad   TEXT    NOT NULL,
  anzahl INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tag, pfad)
);
