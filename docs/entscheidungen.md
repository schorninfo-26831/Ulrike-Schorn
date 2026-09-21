# Entscheidungen

> **Stand: ENTWURF aus Stufe 0 — noch nicht bestätigt.**
> Werte mit *(Vorschlag)* hat Claude aus dem Gespräch und den vorhandenen Unterlagen
> (MARKE-CAMPING-SCHORNI.md, geprüfte Compliance-Daten vom 13.08.2026, Rechtstexte vom 31.08.2026)
> abgeleitet. Werte mit **?** sind offen. Sobald Ulrike korrigiert hat, wird dieser Hinweis entfernt.

**Weiche 1 — was bauen wir:** NACHBAU von https://camping-schorni.de
*(eigene Website — Texte, Fotos und Logo dürfen vollständig übernommen werden)*

**Weiche 2 — worauf läuft es:** A Localhost *(Vorschlag)*
*(Shopify kann keinen eigenen Node-Prozess ausführen und scheidet als Weg C aus. Start auf dem Mac,
später Umzug auf B. Voraussetzung: Node 22 oder neuer — noch zu prüfen.)*

**Art der Website:** **?** — siehe Kernfrage unten
**Leser:** *(Vorschlag)* Der Wohnmobil-Besitzer, der vor dem Saisonstart nicht weiß, was er in seinen
Frischwassertank geben soll — und der Fachchinesisch satt hat
**Die eine Handlung:** **?** — hängt an der Kernfrage
*(Kaufen im Shop · oder: Beratung anrufen unter 04959 9155100)*
**Seiten zum Start:** *(Vorschlag)* Start · Wasser-Ratgeber · Über uns / Schorni · Kontakt & Beratung ·
Impressum + Datenschutz
**Designrichtung:** übernommen aus dem dokumentierten CI, nicht aus dem aktuellen Shopify-Theme
**Abweichung von der Vorlage:** **?** — *Was an der jetzigen Gestaltung soll anders werden?*
**Farben:** Grund `#F1ECE3` (Sand) · Signal `#00C2A8` (Türkis) · Akzent `#0B3B5C` (Marineblau)
*(weitere CI-Werte: Mittelblau `#1A5A8A`, Mint `#E6F8F5`, Gelb `#FFD23F`)*
**Schriften:** Poppins / Poppins *(eine Hausschrift, Gewichte 400 bis 800)*
**Anmutung:** *(Vorschlag)* nah · ehrlich · aufgeräumt
**Offene Fakten:** E-Mail-Adresse für camping-schorni.de bestätigen · Rechtsform · Social-Links ·
Verhältnis der Zweit-Domain caravan-reiniger.de zu camping-schorni.de

---

## Kernfrage — vor allem anderen zu klären

camping-schorni.de ist ein **laufender Shopify-Shop** mit Warenkorb, Kasse und Zahlungsabwicklung.
Der Website-Motor baut Inhaltsseiten; einen Kaufprozess (Warenkorb, Kasse, Zahlung) hat er nicht.

Zwei Wege sind möglich:

| | Weg | Folge |
|---|---|---|
| **1** | **Inhaltsseite neben dem Shop** *(Vorschlag)* — Beratung, Ratgeber, Über uns, Kontakt entstehen KI-nativ; Produkte und Kauf bleiben auf Shopify und werden verlinkt | Shop läuft unverändert weiter, kein Risiko für Bestellungen |
| **2** | **Shop ersetzen** | Nicht mit diesem Motor machbar — es fehlt der gesamte Kaufprozess |

Bei Weg 1 ist zusätzlich zu entscheiden, **welche Domain** die neue Seite bekommt
(z. B. Hauptdomain für die Inhalte, Shop auf einer Subdomain — oder umgekehrt). Das ist eine
SEO-Entscheidung mit Umleitungsliste (Stufe 0b, Punkt 6) und wird nicht nebenbei getroffen.
