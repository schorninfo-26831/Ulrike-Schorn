# Die Vorlage: camping-schorni.de

> **Stand: Teilaufnahme aus Suchergebnissen (21.09.2026).** Die Domain ist aus der Bau-Umgebung
> nicht erreichbar; die vollständige `sitemap.xml` und das ausgelesene CSS folgen von Ulrikes Mac.
> Grundlage für Stufe 0b nach WEBSITE-MOTOR.md.

## 1 · Seitenliste

Der Shop ist breiter als Wasserhygiene: Grillen, Haushalt, Gas & Strom, Zubehör, Campingmöbel.
**Alles, was Sortiment ist, bleibt im Shop** (Entscheidung vom 21.09.). Die Inhaltsseite übernimmt
nur, was Beratung, Marke und Kontakt ist.

| URL | Zweck | Bleibt im Shop | Wird Inhaltsseite |
|---|---|---|---|
| `/` | Startseite | ja (Shop-Start) | **ja — neu**, als Einstieg in Beratung und Ratgeber |
| `/pages/uber-uns-schorni-caravan-reiniger` | Über uns, „von Schorni erzählt" | — | **ja — nachbauen** |
| `/collections/wasser` | Kategorie Wasser (Einleitungstext ist Ratgeber-Material) | ja (Produkte) | Einleitungstext → **Wasser-Ratgeber** |
| `/collections/uv-c-desinfektion` | Kategorie UV-C | ja | Einleitungstext → Ratgeber-Kapitel |
| `/collections/zubehor` | Kategorie Zubehör | ja | nein |
| `/collections/grill-s` | Kategorie Grillen | ja | nein |
| `/collections/strom` | Kategorie Gas & Strom | ja | nein |
| `/collections/haushalt-geschirr-topfe-haushaltsgerate` | Kategorie Haushalt | ja | nein |
| `/collections/all/grillzubehor` | Tag-Seite | ja | nein |
| `/pages/campingmobel` | Campingmöbel | ja | nein |
| `/pages/widerrufserklarung` | Widerrufsbelehrung | ja | nein — die Inhaltsseite verkauft nichts |
| `/products/…` | Produktseiten (u. a. KXpress, UV-8 Serie, Trinkwasserschlauch, CADAC) | ja | nein — verlinkt |
| `/cart` | Warenkorb | ja | nein |
| `/sitemap.xml` | — | — | **noch zu holen** |

### Streichvorschlag für den Start — fünf Seiten, die stehen

1. **Start** — wer Schorni ist, wofür die Seite da ist, die eine Handlung
2. **Wasser-Ratgeber** — Konservierung, Entkalkung, Desinfektion, Filter, UV-C; verlinkt ins Sortiment
3. **Über uns / Schorni** — nachgebaut aus der bestehenden Seite
4. **Kontakt & Beratung** — Telefon, Öffnungszeiten, Anfrageformular (Stufe 3.7)
5. **Impressum + Datenschutz** — Pflicht, auch ohne Verkauf

Später, wenn die fünf stehen: Ratgeber-Kapitel je Thema, „Der Weg des Wassers" (Videoreihe), FAQ.

## 2 · Die eine Handlung

Die Vorlage will sichtbar dreierlei: kaufen, anrufen, sich informieren. **Für die Inhaltsseite
entschieden (21.09.2026): „Zum passenden Produkt im Shop."** Anrufen bleibt sichtbar, aber leise.

## 3 · Gestaltung

Aus dem CI-Dokument (MARKE-CAMPING-SCHORNI.md), **nicht** aus dem Shopify-Theme:
Sand `#F1ECE3` · Türkis `#00C2A8` · Marineblau `#0B3B5C` · Mittelblau `#1A5A8A` · Mint `#E6F8F5` ·
Gelb `#FFD23F` · Schrift Poppins. Logo: `brand/logos/schorni-logo.png` (der mit den weißen Zähnen).

Das CSS der Vorlage wird trotzdem ausgelesen (Anleitung 0b, Punkt 3) — um zu sehen, **wo das Theme
vom CI abweicht**. Das ist vermutlich die Antwort auf „Was soll anders werden?".

## 4 · Tonfall

Du-Anrede. Schorni erzählt selbst („Über uns – von Schorni erzählt"). Warm, direkt, fachkundig ohne
Fachchinesisch. Leitsatz: beraten statt nur verkauft. Für alle Wasserhygiene-Texte gelten die
geprüften Compliance-Regeln (Biozid-VO Art. 72, Silber-Regel, Stopp-Wörter).

## 5 · Fakten

Stehen in `config/facts.json`. Aus der Vorlage bestätigt: Anschrift Bunde, Telefon 04959 9155100,
E-Mail info@caravan-reiniger.de, versandkostenfrei ab 79 € (DE), Lieferung 2–4 Werktage, 14 Tage
Rückgabe. *Versand- und Rückgabeangaben gehören zum Shop und werden auf der Inhaltsseite nicht
wiederholt — eine zweite Quelle veraltet.*

## 6 · Umleitungsliste

**Vorerst leer.** Der Shop behält Domain und URLs; die Inhaltsseite ist neu. Eine Umleitungsliste
wird erst nötig, wenn die Domain-Entscheidung fällt (Inhalte auf die Hauptdomain, Shop auf eine
Subdomain). Dann muss **jede** `/collections/…`- und `/products/…`-URL per 301 auf ihr neues Ziel
zeigen — das ist der Punkt, an dem Nachbauten Sichtbarkeit verlieren.
