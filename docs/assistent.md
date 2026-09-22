# Der Assistent — Stufe 7

Schorni beantwortet auf der Website Fragen. Er spricht **nur über die eigenen Inhalte**: die
veröffentlichten Seiten und die geprüften Produktdaten. Was dort nicht steht, weiß er nicht, und er
sagt das. Das Vorbild steht in docs/assistent-vorbild.md, die Bauanleitung in WEBSITE-MOTOR.md, Stufe 7.

## Wie er arbeitet

1. **Zerlegen.** Beim Speichern wird jede veröffentlichte Seite in Wissensstücke zerlegt: ein Stück je
   Baustein, bei Karten ein Stück je Karte. Kopfzeile, Fußzeile, Pflichthinweis und Formulare zählen
   nicht. Jedes Stück trägt den Slug seiner Seite. Dazu kommt `knowledge/produkte.md`, ein Absatz je
   Produkt (die freigegebenen Formulierungen von Justus), und jede `knowledge/produkte-*.md`, etwa
   `produkte-sortiment.md` mit dem Sortiment Wasser und UV-C aus den Shop-Texten und Gebrauchsanweisungen
   (ohne Preise; für Biozide gelten weiter nur die Steckbriefe). Nach einer Änderung an diesen Dateien
   den Index neu aufbauen: Cockpit „Assistent“ oder `npm run seed`. Rechtstexte sind ausgeschlossen
   (Häkchen „Vom Assistenten ausschließen" im Editor).
2. **Suchen.** Wortsuche mit Wortstämmen und Fachsynonymen („Kalk" findet KXpress, „Keime" findet
   Biofilm). Solange der Bestand klein ist (bis 60 Stücke), bekommt das Modell alle Stücke, das
   Relevante zuerst; sie liegen im zwischengespeicherten Teil des Auftrags und kosten fast nichts.
3. **Antworten.** Das Modell antwortet ausschließlich aus den Auszügen, in Ulrikes Stimme, mit den
   Compliance-Regeln, und schließt mit einer Quellenzeile. Die wird abgeschnitten und als Links unter
   der Antwort gezeigt.
4. **Prüfen im Motor**, nicht nur im Prompt: Gesperrte Formulierungen, verbotene Wörter und Preise
   ersetzen die Antwort durch den Verweis ans Telefon. Nennt die Antwort ein Biozidprodukt, hängt der
   Pflichtsatz nach Artikel 72 an, abgehoben.
5. **Protokoll.** Frage, Antwort und Quellen werden ohne IP-Adresse gespeichert. Unter „Assistent" im
   Cockpit steht jede Frage mit Haken oder Kreuz. Ein Kreuz heißt: Das steht noch nicht auf der Website.

Schlägt etwas fehl, sieht der Leser eine ehrliche Meldung mit der Telefonnummer. Die Seite bleibt
vollständig bedienbar (P6). Fehlt der Schlüssel, erscheint der Knopf gar nicht.

## Bewusste Abweichung: keine Embeddings

Die Bauanleitung rechnet mit Embeddings. Anthropic bietet keinen Embedding-Dienst; ein zweiter
Anbieter wäre ein zweiter Schlüssel und ein zweiter Vertrag. Bei dieser Größe reicht die Wortsuche,
weil das Modell ohnehin den ganzen Bestand sieht. Wächst der Bestand über einige hundert Stücke, ist
ein Embedding-Anschluss ein Zusatz an einer Stelle (`finde()` in `src/assistent.js`), kein Umbau.

## Einschalten

- `ANTHROPIC_API_KEY` in `.env` (derselbe Schlüssel wie für den Generator).
- `config/assistent.json`: `aktiv`, Name, Begrüßung, was er kennt, die vier Vorschlagsfragen, Fußzeile.
  Nach einer Änderung den Motor neu starten.
- Optional in `.env`: `ASSISTENT_MODEL` (Standard `claude-sonnet-5`), `CHAT_TAGESLIMIT` (Standard 300).

Bremsen: 30 Fragen je Absender in zehn Minuten, `CHAT_TAGESLIMIT` Fragen am Tag insgesamt. Danach
sagt Schorni, dass er Pause macht, und nennt das Telefon. Jede Frage kostet beim Anbieter Geld, meist
deutlich unter einem Cent; das Cockpit zeigt unter „Assistent" die Summe des Monats in Euro (Preisliste in
`config/kosten.json`).

## Abnahme Stufe 7

Stell drei Fragen, deren Antwort auf der Website steht, und eine, deren Antwort nicht dort steht.

| | Frage | Erwartung | Geschafft |
|---|---|---|---|
| 1 | „In welcher Reihenfolge pflege ich meinen Tank?" | Erst entkalken, dann desinfizieren, dann konservieren; Quelle Wasser-Ratgeber | ☐ |
| 2 | „Verträgt mein Boiler DEXDA Clean?" | Ja: pH-neutral, für alle gängigen Materialien im Frischwassersystem, nachweislich auch Truma; Pflichtsatz hängt an; Quellen Wasser-Ratgeber und Produktdaten | ☐ |
| 3 | „Wie erreiche ich euch?" | Telefon und Zeiten aus den Fakten, Kontaktseite | ☐ |
| 4 | „Passt das in meinen Dethleffs mit Sondertank?" | **„Das steht hier nicht"** und der Verweis ans Telefon. Erfindet er etwas, ist die Abnahme nicht bestanden. | ☐ |

Dazu: Unter „Assistent" stehen alle vier Fragen, die vierte mit Kreuz.

## Datenschutz

Beim ersten Öffnen des Chats erscheint ein kurzer Hinweis mit Einwilligung: Die Frage geht an den
KI-Anbieter (Anthropic, USA), bitte keine persönlichen Daten. Erst nach „Einverstanden" sind Chips und
Eingabe frei. Die Einwilligung merkt sich nur der Browser, ohne Cookie; „Einwilligung zurücknehmen" in
der Fußzeile löscht sie. Das Chat-Fenster ist als KI-Assistent gekennzeichnet (EU AI Act, Art. 50).
Das Protokoll wird nach zwölf Monaten gelöscht (Motor, täglich).

Die Datenschutzerklärung hat einen Absatz „Der Assistent (Chat)": Anbieter mit Sitz, Einwilligung als
Rechtsgrundlage, Speicherung ohne IP für höchstens zwölf Monate, Bitte um Zurückhaltung bei
persönlichen Daten. Justus hat ihn am 22.09.2026 geprüft (docs/rechtspruefung.md). Offen bleibt das
Data Processing Addendum in der Anthropic-Konsole, das Ulrike akzeptiert.
Wie beim Generator gilt: Der Schlüssel bleibt in `.env`, nie im Repository, nie in einem Chat.
