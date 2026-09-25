# Fertigstellung — der Weg bis zur Live-Schaltung

Stand 25.09.2026. Diese Liste ist der eine Überblick für Ulrike: was fehlt noch, wer macht es, in welcher
Reihenfolge. Sie wird nach jedem erledigten Schritt hier aktualisiert. Die technischen Einzelheiten stehen in
den verlinkten Anleitungen.

**Fertig heißt:** Die Inhaltsseite läuft unter `ratgeber.camping-schorni.de` (Name laut Entscheidung vom
22.09.2026, endgültig beim Livegang), alle Seiten sind von Ulrike freigegeben, die Rechtstexte sind geprüft,
Anfragen kommen per Mail an, der Assistent antwortet, und der Shop verlinkt auf den Ratgeber.

## Was schon steht

- Motor, Cockpit, Generator, Übersichten und Assistent sind gebaut und laufen auf Ulrikes Mac (Stufen 1 bis 7).
- 17 Seiten in `content/`: sechs veröffentlicht (Start, Wasser-Ratgeber, Über uns, Kontakt, Impressum,
  Datenschutz), Übersicht `/ratgeber/`, neun Ratgeber-Kapitel im Status „generiert“.
- Eine Produktwahrheit in `knowledge/produkte.md`; Silbernetz Flex und Silvertex sind geklärt; DEXDA Plus ist raus.
- Assistent am Mac bestätigt (23.09.2026), Silvertex-Frage richtig beantwortet.
- Weg B ist vorbereitet: Dockerfile, docker-compose.yml, Caddyfile.

## Die fünf Schritte bis Live

### 1 · Inhalte freigeben — Ulrike, im Cockpit, etwa zwei Stunden

| | Schritt | Wo |
|---|---|---|
| ☐ | Neun Ratgeber-Kapitel lesen und einzeln auf „Veröffentlichen“ setzen | Cockpit → Seiten |
| ☐ | „Über uns“: dein Originaltext ersetzt den Platzhalter | Cockpit → Seiten → Über uns |
| ☐ | Vier Abnahmefragen an Schorni, dann Cockpit „Assistent“ ansehen (docs/assistent.md) | Website, Chat |
| ☐ | Fünf Prüfpunkte Stufe 6: Übersicht und Menü (docs/erweitern.md) | Website |

### 2 · Recht — Justus, dann Ulrike

| | Schritt | Wer |
|---|---|---|
| ☐ | Legionellen-Absätze auf „Wasserhygiene, auch ohne Trinken“ prüfen | Justus |
| ☐ | BAuA-Nummer von Silbernetz Flex und Silvertex klären: Gebrauchsanweisung N-108213, Shop und Steckbrief N-72324 | Justus, WM aquatec |
| ☐ | Datenschutz: Hoster und Standort eintragen, sobald Schritt 3 entschieden ist; Absatz zum Chat prüfen | Justus |
| ☐ | Anthropic-Datenverarbeitungsvertrag (DPA) in der Konsole akzeptieren | Ulrike |

### 3 · Drei Entscheidungen — nur Ulrike

| | Entscheidung | Empfehlung |
|---|---|---|
| ☐ | **Hoster** für Weg B | Ein kleiner Server in Deutschland (etwa Hetzner), darauf die vorbereiteten Docker-Dateien. Standort Deutschland macht den Datenschutz-Absatz einfach |
| ☐ | **SMTP-Zugang** für den Mailversand der Anfragen an info@caravan-reiniger.de | Die Zugangsdaten des Postfachs, eingetragen nur beim Hoster, nie im Repository |
| ☐ | **Subdomain-Name** endgültig bestätigen | ratgeber.camping-schorni.de, wie am 22.09.2026 vorgeschlagen |

### 4 · Livegang — Claude mit Ulrike, eine Sitzung

| | Schritt | Wer |
|---|---|---|
| ☐ | Zweig nach `main` bringen (Pull Request) | Claude, Ulrike gibt frei |
| ☐ | Server einrichten, Docker starten, Schlüssel und Passwort beim Hoster eintragen | Claude bereitet vor, Ulrike trägt Werte ein |
| ☐ | Subdomain per A-Record auf den Server zeigen, Name in `config/site.json` | Ulrike beim Domain-Anbieter, Claude im Repository |
| ☐ | Inhalte einspielen (`npm run seed`), Cockpit-Passwort setzen | Claude |
| ☐ | Sechs Prüfpunkte aus docs/veroeffentlichen.md an der Live-Adresse | Ulrike |

### 5 · Shop verbinden — Ulrike im Shopify-Admin

| | Schritt |
|---|---|
| ☐ | Vier Textstellen zu Silvertex und Silbernetz Flex einsetzen, Varianten prüfen (Auftrag vom 23.09.2026) |
| ☐ | Menüpunkt „Ratgeber“ im Shop auf die neue Subdomain legen |

## Später, nicht für den Livegang nötig

- Stufe 4, erster echter Generator-Lauf gegen die Goldreferenz (docs/lokal-starten.md).
- Vollständige Sitemap und CSS-Auslesen der alten Seite (Stufe 0b).
- Netzwerkfreigabe für Cloud-Sitzungen: camping-schorni.de und wm-aquatec.de.

## Der nächste Schritt

Schritt 1 im Cockpit. Danach die Hoster-Entscheidung, weil Datenschutz und Livegang daran hängen.
