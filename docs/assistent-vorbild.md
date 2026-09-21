# Der Assistent — Vorbild und Abweichungen

> Gehört zu **Stufe 7** in WEBSITE-MOTOR.md. Wird gebaut, wenn Stufe 1 bis 6 stehen — nicht vorher.
> Ulrike hat am 21.09.2026 fünf Screenshots des Vorbilds geliefert; diese Datei ersetzt sie.

## Vorbild: „Lisa" auf koerting-institute.com

Der Assistent der Schulungs-Website selbst. Er ist offenbar nach demselben Muster gebaut, das die
Anleitung in Stufe 7 beschreibt — und er zeigt, wie das Ergebnis aussehen soll.

### Was Lisa richtig macht und was übernommen wird

| Merkmal | Bei Lisa | Bei Schorni |
|---|---|---|
| **Name und Gesicht** | „Lisa", Foto-Avatar | **Schorni**, das Maskottchen (mit den weißen Zähnen) |
| **Erste Zeile sagt, was er kennt** | „über 500 Podcast-Folgen, alle Programme, das KI-Café und den Shop" | „den Wasser-Ratgeber, alle Produkte zur Wasserhygiene und wie du mich erreichst" |
| **Vorschlagsfragen als Chips** | vier Stück unter der Begrüßung | ja — die häufigsten Telefonfragen |
| **Quellen unter der Antwort** | zwei Chips mit Seitentitel | ja — Pflicht nach Stufe 7 („Verweise auf die Seite, aus der du zitierst") |
| **Ehrliche Grenze** | „mein Zugriff zeigt mir dort leider nur Platzhalter, keine konkreten Live-Daten" | ja — bei Einbau, Sondertanks, allem außerhalb der geprüften Daten → Telefon |
| **Weiterleitung statt Sackgasse** | Link zur Angebotsseite, Hinweis aufs kostenlose KI-Café | Link ins passende Sortiment, Hinweis auf die Telefonberatung |
| **Bilder in der Antwort** | Foto eines Workshops | möglich, später — Produktbilder aus dem Shop |
| **Fußzeile** | „Lisa lernt noch – Fehler sind möglich · Datenschutz" | „Schorni lernt noch – Fehler sind möglich · Datenschutz" |
| **Spracheingabe** | Mikrofon-Symbol im Kopf | später, nicht in der ersten Fassung |
| **Aufruf** | schwebender Knopf unten links, Panel öffnet sich | gleich |

### Was bewusst anders wird

1. **Keine Preise im Bot.** Lisa nennt Preise („ab 295 €"). Schorni nicht — Preise leben im Shop
   (Entscheidung vom 21.09.: die Inhaltsseite nennt keine Preise, sie verlinkt). Ein Preis im Bot
   wäre eine zweite Quelle, die veraltet.
2. **Biozid-Pflichthinweis.** Sobald eine Antwort ein Biozidprodukt nennt, hängt der Satz nach
   Artikel 72 an — abgehoben. Lisa braucht das nicht, Schorni schon.
3. **Gesperrte Formulierungen.** „100 % keimfrei", „alle Keime", „natürliche Wasserkonservierung",
   „macht Wasser trinkbar" kann der Bot strukturell nicht sagen. Der Prompt aus Stufe 7 wird um
   diese Sperrliste ergänzt.
4. **Wissensbasis = geprüfte Produktdaten + Ratgeber-Seiten**, nicht „alles, was auf der Website
   steht". Der Shop wird nicht indexiert; Produktfragen enden mit einem Link ins Sortiment.

## Prototyp

Ein klickbarer Vorabzug existiert bereits — gebaut am 21.09.2026 aus den geprüften Compliance-Daten,
im CI, mit festen Beispielantworten:
**Schorni Wasser-Lotse** — https://claude.ai/artifact/P6mbdM6VP1vPzaiE3kksWV

Er zeigt Tonfall, Gestaltung und die Absicherungslogik. Er hat keine Suche und kein Sprachmodell —
das kommt in Stufe 7, wenn die Seiten strukturiert in der Datenbank liegen und zerlegt werden können.

## Warum nicht jetzt

Die Anleitung ist eindeutig (Stufe 6): *„Suche und Assistent kommen zuletzt. Baue sie nicht vorher."*
Der Grund steht in Stufe 7: Der Bot zerlegt die **Bausteine** der Seiten in Absätze — ohne Seiten
gibt es nichts zu zerlegen. Ein Bot, der stattdessen die alte Shopify-Seite scrapt, wäre genau der
KI-first-Umweg, den der Motor abschaffen will.
