# Camping Schorni — KI-native Inhaltsseite

Dieses Projekt ist nach **[WEBSITE-MOTOR.md](WEBSITE-MOTOR.md)** gebaut, der Bauanleitung aus der
Schulung. Lies sie zuerst — Teil I erklärt, warum das System so gebaut ist und nicht anders.

Alle Entscheidungen stehen in **[docs/entscheidungen.md](docs/entscheidungen.md)**, freigegeben von
Ulrike am 21.09.2026. Was dort steht, wird nicht neu verhandelt. Was dort fehlt, wird gefragt, nicht geraten.

Weitere Referenzen: [docs/vorlage.md](docs/vorlage.md) (Bestandsaufnahme von camping-schorni.de) ·
[docs/assistent-vorbild.md](docs/assistent-vorbild.md) (Stufe 7, der Assistent).

## Starten — Weg A, Node ≥ 22.13

```bash
npm i && npm run seed && npm start      # → http://localhost:3000
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
- Prüfen am laufenden System, nicht am Quelltext: `node -e "fetch('http://localhost:3000/').then(r=>console.log(r.status))"`
- Windows und Mac gleich: Pfade mit Schrägstrich, Ordner vor Gebrauch anlegen, keine Shell-Skripte in `package.json`.

## Stand

| Stufe | Status |
|---|---|
| 0 · Das Gespräch | ✔ 21.09.2026 |
| 0b · Die Vorlage lesen | ✔ Teilaufnahme — vollständige Sitemap und CSS-Auslesen stehen aus |
| 1 · Der Motor | ✔ 21.09.2026 — Motor läuft, Startseite rendert, 6 Tests grün, kein waagerechtes Scrollen bei 390 px |
| 2 · Goldreferenz + Startseiten | ✔ 21.09.2026 — sechs Seiten (start, wasser-ratgeber, ueber-uns, kontakt, impressum, datenschutz), vier Seitentypen mit golden.html, Poppins selbst gehostet, 11 Tests grün. Offen: Über-uns-Originaltext von Ulrike; Datenschutz vor Stufe 5 durch Justus prüfen |
| 3 · Cockpit | nächste |
| 4 · KI als Motor | — |
| 5 · Öffentlich | — |
| 6 · Erweitern | — |
| 7 · Assistent | — |
