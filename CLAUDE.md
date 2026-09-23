# Camping Schorni — KI-native Inhaltsseite

Dieses Projekt ist nach **[WEBSITE-MOTOR.md](WEBSITE-MOTOR.md)** gebaut, der Bauanleitung aus der
Schulung. Lies sie zuerst — Teil I erklärt, warum das System so gebaut ist und nicht anders.

Alle Entscheidungen stehen in **[docs/entscheidungen.md](docs/entscheidungen.md)**, freigegeben von
Ulrike am 21.09.2026. Was dort steht, wird nicht neu verhandelt. Was dort fehlt, wird gefragt, nicht geraten.

Weitere Referenzen: [docs/vorlage.md](docs/vorlage.md) (Bestandsaufnahme von camping-schorni.de) ·
[docs/lokal-starten.md](docs/lokal-starten.md) (Mac, Abnahmen) · [docs/veroeffentlichen.md](docs/veroeffentlichen.md) (Stufe 5, Weg A und B) ·
[docs/erweitern.md](docs/erweitern.md) (Stufe 6: neuer Seitentyp, neuer Baustein, Übersichten) · [docs/assistent.md](docs/assistent.md) (Stufe 7) ·
[docs/assistent-vorbild.md](docs/assistent-vorbild.md) (Stufe 7, der Assistent).

## Starten — Weg A, Node ≥ 22.13

```bash
cp .env.example .env                     # ADMIN_PASSWORD eintragen — sonst kein Cockpit
npm i && npm run seed && npm start      # → http://localhost:3000 · Cockpit: /admin/
npm run seed -- --force                  # Inhalte aus content/*.json neu einspielen (P5: nur mit Force)
npm test                                 # läuft ohne Datenbank und ohne Schlüssel
npm run golden -- <typ>                  # Goldreferenz eines Seitentyps aus seiner Seite in content/ erzeugen (P4)
```

## Was hier gilt

- **P1** Die KI schreibt nie HTML. Sie liefert JSON gegen ein Schema; die Bausteine in `src/blocks/` rendern. Seiteninhalte liegen als JSON in `content/`.
- **P2** Fakten nur aus `config/facts.json`, im Text als `{{facts.pfad}}`. Fehlt ein Wert, steht sichtbar `[…]` auf der Seite.
- Farben und Schriften nur als Token aus `config/theme.json`. Nie eine Farbe direkt in einen Baustein.
- Die eine Handlung: **Zum passenden Produkt im Shop.** Das Telefon bleibt auf jeder Seite sichtbar, aber leise.
- **Keine Preise** auf dieser Seite — sie verlinkt in den Shop. Der Shop bleibt auf Shopify und wird nicht nachgebaut.
- Anrede **Du**. Verbotene Wörter: eintauchen, entdecken, enthüllen, umarmen.
- Wasserhygiene-Texte folgen den geprüften Compliance-Daten (Skill `schorn-biozid-compliance`): Pflichtsatz nach Biozid-VO Art. 72, Silber-Regel, Stopp-Wörter.
- **Eine Produktwahrheit:** `knowledge/produkte.md` ist die einzige Quelle für Produktdaten. Änderungen nur dort, mit Datum und Urheber; Skill, Shop-Texte, Seiten und Assistent werden daraus abgeleitet. Bei Widerspruch gilt: Ulrike, dann Gebrauchsanweisung, zuletzt Shop-Text (docs/entscheidungen.md, 22.09.2026).
- **Stufe 7** Der Assistent antwortet nur aus Wissensstücken (veröffentlichte Seiten ohne `chat_excluded` + `knowledge/produkte.md` + `knowledge/produkte-*.md`), nie aus dem Modellgedächtnis; Sperrliste, Preise und Pflichthinweis prüft der Motor. Rechtstexte sind ausgeschlossen.
- **Stufe 4** Der Generator liest `knowledge/` (Stimme, Compliance, Shop-Ziele) und `page-types/<typ>/prompt.md`, liefert JSON gegen den Vertrag, Status immer `generated`. Schlüssel nur in `.env` (`ANTHROPIC_API_KEY`), nie im Repo, nie im Chat. Das Modell ist eine Funktion; Tests laufen ohne Netz.
- **Kosten sichtbar:** Jeder Generator-Lauf und jede Assistent-Antwort landet ohne Inhalt im Verbrauchsbuch (`ki_verbrauch`); das Cockpit zeigt Euro je Lauf und je Monat. Preise je Million Token und Wechselkurs nur in `config/kosten.json`, nie im Code.
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
| 4 · KI als Motor | gebaut 21.09.2026 — `src/generator.js` (Auftrag aus Schema, Goldreferenz-JSON, `knowledge/`, `page-types/<typ>/prompt.md`; gehärteter JSON-Parser; Vertrag hart, Hinweise weich; Pflichthinweis wird ergänzt; Status immer `generated`), Cockpit-Punkt „Generieren" + „Neu generieren" im Editor, Handbuch, 24 Tests grün ohne Schlüssel. **Schlüssel eingetragen 22.09.2026** (frischer Klon unter ~/Documents/camping-schorni-website, Cockpit zeigt „Generieren"). **Abnahme offen:** erster echter Lauf, Ergebnis gegen die Goldreferenz (docs/lokal-starten.md) |
| 5 · Öffentlich | gebaut 22.09.2026 (Weg A) — Tunnel zum Zeigen (docs/veroeffentlichen.md), P6-Schichten: Standard-og:image + canonical/og:url absolut, Zugriffe ohne personenbezogene Daten (Cockpit „Zugriffe"), Mailversand für Anfragen (SMTP_URL/MAIL_TO), Sicherheits-Kopfzeilen, Anmeldebremse, trust proxy; Weg B vorbereitet (Dockerfile, docker-compose.yml, Caddyfile, pg). **Abnahme offen:** sechs Prüfpunkte am Tunnel. **Entscheidungen offen:** Domain, Hoster, Justus-Prüfung, E-Mail, SMTP (Abschnitt 4 in docs/veroeffentlichen.md) |
| 6 · Erweitern | gebaut 22.09.2026 — Baustein „Übersicht" (`liste`, liest den Bestand bei jedem Aufruf, P3), Seitentyp `uebersicht` + Seite `/ratgeber/`, zweite Menüebene in der Kopfzeile, Auswahlfelder im Cockpit (`select`), `npm run golden -- <typ>` erzeugt Goldreferenzen; docs/erweitern.md (neuer Typ = Ordner, neuer Baustein = Motor). **Abnahme offen:** fünf Prüfpunkte; Menü auf dem Mac umbauen |
| Inhalte | 22.09.2026: neun neue Ratgeber-Seiten in `content/`, Status `generated` (Ulrike liest und veröffentlicht im Cockpit): `wasser-lexikon` (49 Begriffe, aus Ulrikes Glossar in der OneDrive-Ablage und dem WM-aquatec-Wissen), `wasserhygiene-europa`, `wasserhygiene-suedeuropa-weltweit`, `wasser-auf-expedition`, `uv-c-am-auslass`, `filtern-beim-tanken`, `saison-check-schritt-fuer-schritt`, `wasserhygiene-auch-ohne-trinken`, `konservieren-oder-desinfizieren` (Quelle: WM-aquatec-Anwender- und Technologieseiten, die Gebrauchsanweisungen und Etiketten aus Ulrikes Zip-Archiven und die drei Beiträge der WM-aquatec-Praxis-Serie, alle am 22.09.2026 von Ulrike eingefügt; Teil 2 der Serie erweitert `filtern-beim-tanken`; in eigenen Worten, nur freigegebene Formulierungen, keine Prozentzahlen, keine Preise, keine fremden Bewertungen). **Für Justus:** Legionellen-Absätze auf `wasserhygiene-auch-ohne-trinken`; BAuA-Nummer von Silbernetz Flex und Silvertex (beide Gebrauchsanweisungen: N-108213, Shopdaten und Steckbriefe: N-72324); Steckbrief Silvertex am 22.09.2026 nach Ulrikes Korrektur angeglichen (dasselbe Produkt wie Silbernetz Flex, andere Verpackung); 23.09.2026 präzisiert: gleicher Einsatz (Tank und Kanister), einziger Unterschied der Doppelpack für 15 und 30 Liter bei Silbernetz Flex, eigenes Wissensstück „der Unterschied“ |
| 7 · Assistent | gebaut 22.09.2026 — `src/assistent.js`: Seiten werden beim Speichern in Wissensstücke zerlegt (Karten je Eintrag), dazu `knowledge/produkte.md`; Wortsuche mit Stämmen und Fachsynonymen, kleiner Bestand komplett im zwischengespeicherten Systemteil (bewusst ohne Embeddings: Anthropic hat keinen Embedding-Dienst); Antwort nur aus Auszügen, Quellenzeile → Chips, Sperrliste und Preise im Motor abgefangen, Pflichthinweis bei Biozid; Strom als NDJSON über `POST /api/chat`; Widget `public/assistent.js` (Knopf unten links, Chips, Quellen, Pflichtsatz); Cockpit „Assistent" (Index, Fragen mit Haken/Kreuz), Häkchen „Vom Assistenten ausschließen"; Bremsen 30/10 min je Absender, CHAT_TAGESLIMIT; `config/assistent.json`. **Produktwissen erweitert 22.09.2026:** `knowledge/produkte-sortiment.md`, 34 Absätze zum Sortiment Wasser und UV-C aus den Shopify-Texten (Google Drive, Pflege Juli bis August 2026) und den Gebrauchsanweisungen, ohne Preise, Biozide nur laut Steckbrief; `ladeProduktwissen()` liest produkte.md plus produkte-*.md. **Ulrike prüft die Absätze.** DEXDA Plus ist seit 22.09.2026 raus (docs/entscheidungen.md). **Abnahme offen:** drei Fragen mit Antwort auf der Website, eine ohne (docs/assistent.md); Datenschutz-Absatz zu Justus |
