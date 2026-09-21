# Lokal starten und das Cockpit abnehmen

Für die Abnahme von Stufe 3 musst du die Website auf deinem Mac laufen lassen und die
neun Handgriffe selbst machen — ohne Hilfe. So steht es in WEBSITE-MOTOR.md, und so
findet sich heraus, ob Cockpit und Handbuch reichen.

## Einmalig: holen und einrichten

Terminal öffnen (⌘ + Leertaste, „Terminal"). Dann Block für Block einfügen.

**1 · Node prüfen** — es muss 22.13 oder neuer sein:

```bash
node -v
```

Ist die Zahl kleiner: Node von https://nodejs.org installieren (LTS), Terminal neu öffnen, nochmal prüfen.

**2 · Projekt holen:**

```bash
cd ~/Documents
git clone https://github.com/schorninfo-26831/Ulrike-Schorn.git camping-schorni-website
cd camping-schorni-website
git checkout claude/website-motor-stufe-0-fkxuo8
```

**3 · Passwort fürs Cockpit setzen** — ersetze `DeinGeheimesPasswort`:

```bash
cp .env.example .env
sed -i '' 's/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=DeinGeheimesPasswort/' .env
```

Die Datei `.env` bleibt auf deinem Mac; sie wird nie ins Repository übertragen.

**4 · Installieren, Inhalte einspielen, starten:**

```bash
npm i && npm run seed && npm start
```

Wenn `[Motor] v0.3.0 läuft auf http://localhost:3000 · Cockpit: /admin/` erscheint, bist du drin:

- Website: http://localhost:3000
- Cockpit: http://localhost:3000/admin/

Beenden mit `Ctrl + C` im Terminal. Später wieder starten: `cd ~/Documents/camping-schorni-website && npm start`.

## Die Abnahme — neun Handgriffe, ohne Hilfe

Im Cockpit steht rechts das **Handbuch** mit jedem Ablauf und den echten Knopfnamen. Arbeite die
Liste ab. Wo du stockst, fehlt etwas — im Cockpit oder im Handbuch. Das ist dann kein Fehler von dir,
sondern ein Befund, den du mir meldest.

| | Handgriff | Geschafft |
|---|---|---|
| 1 | Eine Seite anlegen (Typ „Seite", irgendein Titel) | ☐ |
| 2 | Einen Fließtext-Baustein hinzufügen, Text schreiben, speichern, Vorschau ansehen | ☐ |
| 3 | Unter „Medien" ein Bild hochladen (mit Alt-Text) und es in die Seite einsetzen | ☐ |
| 4 | Die Seite veröffentlichen und im Browser unter ihrer Adresse aufrufen | ☐ |
| 5 | Die Seite unter „Navigation" ins Menü hängen, speichern, auf der Website prüfen | ☐ |
| 6 | Den Slug der Seite ändern und die alte Adresse aufrufen — sie muss weiterleiten | ☐ |
| 7 | Auf der Website unter /kontakt/ das Formular abschicken, dann unter „Anfragen" nachsehen | ☐ |
| 8 | Unter „Fakten" die kurzen Öffnungszeiten ändern, speichern, auf der Startseite prüfen — dann zurückändern | ☐ |
| 9 | Die Testseite löschen (sie ist veröffentlicht, also mit Umleitungsziel) | ☐ |

Wenn alle neun Haken stehen, ist Stufe 3 abgenommen.

## Später: Aktualisierungen holen

```bash
cd ~/Documents/camping-schorni-website && git pull && npm i && npm start
```

**Vorsicht mit `npm run seed -- --force`:** Das überschreibt die sechs Startseiten mit dem Stand aus
`content/*.json` — auch das, was du im Cockpit daran geändert hast. Ohne `--force` lässt das Seed
vorhandene Seiten in Ruhe (P5: nichts wird stillschweigend überschrieben).
