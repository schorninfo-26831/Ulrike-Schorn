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

**Art der Website:** Inhaltsseite neben dem Shop — Beratung, Ratgeber, Über uns, Kontakt entstehen
KI-nativ; Produkte und Kauf bleiben auf Shopify und werden verlinkt. *(bestätigt von Ulrike, 21.09.2026)*
**Leser:** *(Vorschlag)* Der Wohnmobil-Besitzer, der vor dem Saisonstart nicht weiß, was er in seinen
Frischwassertank geben soll — und der Fachchinesisch satt hat
**Die eine Handlung:** **?** — *(Vorschlag)* „Zum passenden Produkt im Shop"
*(Alternative: Beratung anrufen unter 04959 9155100. Das Telefon bleibt in jedem Fall im Kopf der
Seite sichtbar; die Frage ist nur, welcher Knopf der auffällige ist.)*
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

## Kernfrage — entschieden am 21.09.2026

camping-schorni.de ist ein **laufender Shopify-Shop** mit Warenkorb, Kasse und Zahlungsabwicklung.
Der Website-Motor baut Inhaltsseiten; einen Kaufprozess hat er nicht.

**Entscheidung: Der Shop bleibt auf Shopify und läuft unverändert weiter. Die neue Seite entsteht
daneben** — Beratung, Ratgeber, Über uns, Kontakt und später der Assistent (Stufe 7). Produkte
werden in den Shop verlinkt, nie nachgebaut.

Was daraus folgt:

- Der Kaufprozess wird nicht angefasst. Keine Bestellung ist in Gefahr.
- **Domain noch offen:** Hauptdomain für die Inhalte und Shop auf einer Subdomain — oder umgekehrt.
  Das ist eine SEO-Entscheidung mit Umleitungsliste (Stufe 0b, Punkt 6) und wird gesondert getroffen,
  nicht nebenbei. Bis dahin läuft die neue Seite lokal (Weg A) und braucht keine Domain.
- Produktfakten (Preise, Gebinde, Verfügbarkeit) bleiben in Shopify. Die neue Seite nennt keine
  Preise — sie verlinkt (P2: Fakten kommen nie aus dem Modell, und hier auch nicht aus einer zweiten Quelle).
