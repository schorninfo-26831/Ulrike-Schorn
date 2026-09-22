# Camping Schorni — KI-native Inhaltsseite

Dieses Projekt ist nach **[WEBSITE-MOTOR.md](WEBSITE-MOTOR.md)** gebaut, der Bauanleitung aus der
Schulung. Lies sie zuerst — Teil I erklärt, warum das System so gebaut ist und nicht anders.

Alle Entscheidungen stehen in **[docs/entscheidungen.md](docs/entscheidungen.md)**, freigegeben von
Ulrike am 21.09.2026. Was dort steht, wird nicht neu verhandelt. Was dort fehlt, wird gefragt, nicht geraten.

Weitere Referenzen: [docs/vorlage.md](docs/vorlage.md) (Bestandsaufnahme von camping-schorni.de) ·
[docs/lokal-starten.md](docs/lokal-starten.md) (Mac, Abnahmen) · [docs/veroeffentlichen.md](docs/veroeffentlichen.md) (Stufe 5, Weg A und B) ·
[docs/assistent-vorbild.md](docs/assistent-vorbild.md) (Stufe 7, der Assistent).

## Starten — Weg A, Node ≥ 22.13

```bash
cp .env.example .env                     # ADMIN_PASSWORD eintragen — sonst kein Cockpit
npm i && npm run seed && npm start      # → http://localhost:3000 · Cockpit: /admin/
npm run seed -- --force                  # Inhalte aus content/*.json neu einspielen (P5: nur mit Force)
npm test                                 # läuft ohne Datenbank und ohne Schlüssel
```

## Was hier gilt

- **P1** Die KI schreibt nie HTML. Sie liefert JSON gegen ein Schema; die Bausteine in `src/blocks/` rendern. Seiteninhalte liegen als JSON in `content/`.
- **P2** Fakten nur aus `config/facts.json`, im Text als `{{facts.pfad}}`. Fehlt ein Wert, steht sichtbar `[…]` auf der Seite.
- Farben und Schriften nur als Token aus `config/theme.json`. Nie eine Farbe direkt in einen Baustein.
- Die eine Handlung: **Zum passenden Produkt im Shop.** Das Telefon bleibt auf jeder Seite sichtbar, aber leise.
- **Keine Preise** auf dieser Seite — sie verlinkt in den Shop. Der Shop bleibt auf Shopify und wird nicht nachgebaut.
- Anrede **Du**. Verbotene Wörter: eintauchen, entdecken, enthüllen, umarmen.
- Wasserhygiene-Texte folgen den geprüften Compliance-Daten (Skill `schorn-biozid-compliance`): Pflichtsatz nach Biozid-VO Art. 72, Silber-Regel, Stopp-Wörter.
- **Stufe 4** Der Generator liest `knowledge/` (Stimme, Compliance, Shop-Ziele) und `page-types/<typ>/prompt.md`, liefert JSON gegen den Vertrag, Status immer `generated`. Schlüssel nur in `.env` (`ANTHROPIC_API_KEY`), nie im Repo, nie im Chat. Das Modell ist eine Funktion; Tests laufen ohne Netz.
- Prüfen am laufenden System, nicht am Quelltext: `node -e "fetch('http://localhost:3000/').then(r=>console.log(r.status))"`
- Windows und Mac gleich: Pfade mit Schrägstrich, Ordner vor Gebrauch anlegen, keine Shell-Skripte in `package.json`.

## Stand

| Stufe | Status |
|---|---|
| 0 · Das Gespräch | ✔ 21.09.2026 |
| 0b · Die Vorlage lesen | ✔ Teilaufnahme — vollständige Sitemap und CSS-Auslesen stehen aus |
| 1 · Der Motor | ✔ 21.09.2026 — Motor läuft, Startseite rendert, 6 Tests grün, kein waagerechtes Scrollen bei 390 px |
| 2 · Goldreferenz + Startseiten | ✔ 21.09.2026 — sechs Seiten (start, wasser-ratgeber, ueber-uns, kontakt, impressum, datenschutz), vier Seitentypen mit golden.html, Poppins selbst gehostet, 11 Tests grün. Offen: Über-uns-Originaltext von Ulrike; Datenschutz vor Stufe 5 durch Justus prüfen |
| 3 · Cockpit | ✔ 21.09.2026 — Login, Seiten (anlegen/bearbeiten/umbenennen mit 301/löschen mit Umleitung), Navigation als Daten, Medien mit Alt-Pflicht, Umleitungen, Formular mit Honigtopf und Anfragen-Liste, Fakten ohne Deploy, Handbuch; automatisierte Abnahme 19/19 im Browser, 18 Unit-Tests. **Von Ulrike am Mac abgenommen: alle neun Handgriffe** (docs/lokal-starten.md) |
| 4 · KI als Motor | gebaut 21.09.2026 — `src/generator.js` (Auftrag aus Schema, Goldreferenz-JSON, `knowledge/`, `page-types/<typ>/prompt.md`; gehärteter JSON-Parser; Vertrag hart, Hinweise weich; Pflichthinweis wird ergänzt; Status immer `generated`), Cockpit-Punkt „Generieren" + „Neu generieren" im Editor, Handbuch, 24 Tests grün ohne Schlüssel. **Abnahme offen:** erster echter Lauf mit Ulrikes Schlüssel, Ergebnis gegen die Goldreferenz (docs/lokal-starten.md) |
| 5 · Öffentlich | gebaut 22.09.2026 (Weg A) — Tunnel zum Zeigen (docs/veroeffentlichen.md), P6-Schichten: Standard-og:image + canonical/og:url absolut, Zugriffe ohne personenbezogene Daten (Cockpit „Zugriffe"), Mailversand für Anfragen (SMTP_URL/MAIL_TO), Sicherheits-Kopfzeilen, Anmeldebremse, trust proxy; Weg B vorbereitet (Dockerfile, docker-compose.yml, Caddyfile, pg). **Abnahme offen:** sechs Prüfpunkte am Tunnel. **Entscheidungen offen:** Domain, Hoster, Justus-Prüfung, E-Mail, SMTP (Abschnitt 4 in docs/veroeffentlichen.md) |
| 6 · Erweitern | — |
| 7 · Assistent | — |
