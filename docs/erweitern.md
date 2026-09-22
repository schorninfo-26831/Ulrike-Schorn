# Erweitern — Stufe 6

Jetzt ist Erweitern billig. Das ist der Satz aus der Bauanleitung, und er lässt sich prüfen.

## Was Stufe 6 gebracht hat

- **Übersichtsseiten nach P3.** Der Baustein „Übersicht" (`liste`) speichert keine Liste. Er liest bei
  jedem Aufruf den Bestand: alle veröffentlichten Seiten eines Typs. Veröffentlichst du ein neues
  Ratgeber-Kapitel, steht es auf `/ratgeber/`, ohne dass jemand die Übersicht anfasst.
- **Der Seitentyp „Übersicht"** (`page-types/uebersicht/`) und die Seite `/ratgeber/`, die alle
  Ratgeber-Kapitel auflistet. Im Menü hängt der Wasser-Ratgeber jetzt als Unterpunkt unter „Ratgeber".
- **Zweite Menüebene.** Unterpunkte erscheinen am Desktop als Aufklappmenü unter dem Hauptpunkt. Auf
  dem Telefon führt der Hauptpunkt zur Seite, die sie auflistet. Deshalb sollte ein Hauptpunkt mit
  Unterpunkten eine Übersichtsseite sein.
- **Auswahlfelder** im Cockpit: ein Baustein kann ein Feld mit festen Werten anbieten (Seitentyp,
  Reihenfolge, Bildbreite). Kein Tippen von „schmal" mehr.
- **`npm run golden -- <typ>`** erzeugt die Goldreferenz eines Seitentyps aus seiner ersten Seite in
  `content/`. Vorher war das Handarbeit.

## Ein neuer Seitentyp kostet einen Ordner

Vier Dateien, kein Eingriff in den Motor:

```
page-types/<typ>/
  type.json      { "label": "…", "beschreibung": "…" }
  schema.json    { "allowedBlocks": […], "requiredBlocks": […] }
  prompt.md      Anweisung für den Generator (Aufbau, Ton, was nicht hinein darf)
  golden.html    die Goldreferenz — erzeugt mit: npm run golden -- <typ>
content/<seite>.json   die erste Seite dieses Typs; sie ist die Goldreferenz und das Beispiel für den Generator
```

Danach `npm run seed` (spielt die neue Seite ein, lässt vorhandene in Ruhe) und den Motor neu starten:
Die Seitentypen werden beim Start gelesen. Ab dann bietet „Neue Seite" den Typ an, „Generieren" kennt
ihn, und die Vorschau rendert ihn.

Das ist der Abnahmepunkt „Ein neuer Seitentyp kostet einen Ordner, keine Änderung am Motor" aus der
Bauanleitung. Er wird automatisch geprüft: ein Testlauf legt einen Ordner an, startet neu und findet
den Typ im Cockpit.

## Ein neuer Baustein ist ein Eingriff in den Motor — ein kleiner

Ein Baustein ist eine Datei in `src/blocks/` mit `name`, `label`, `schema`, `css`, `render(data)` und
optional `pruefe(data)`, dazu ein Import und ein Name in der Liste in `src/blocks/index.js`. Danach:

- erscheint er im Cockpit mit einem Formular aus seinem Schema (Feldtypen: `text`, `longtext`,
  `image`, `bool`, `list`, `select`),
- kennt ihn der Generator, sobald ein Seitentyp ihn in `allowedBlocks` führt,
- rendert ihn jede Seite, deren Typ ihn erlaubt.

Braucht er Daten von außen (Menü, Bestand, Formularbezug), liefert `dynamik()` in
`src/routes/public.js` sie unter seinem Namen. So bekommt „Übersicht" den Bestand, so bekommt die
Kopfzeile das Menü (P3).

## Das Menü auf deinem Mac umbauen

Das Anfangsmenü wird nur in eine leere Datenbank eingespielt. Auf deinem Mac gehört das Menü dem
Cockpit, also baust du die zweite Ebene selbst, mit den Handgriffen aus Stufe 3:

1. `git pull && npm i && npm run seed && npm start` — das Seed legt `/ratgeber/` an.
2. „Navigation" öffnen. Links bei „Ratgeber" auf „+". Der Punkt landet unten im Menü; mit ↑ nach oben.
3. Beim Punkt „Wasser-Ratgeber" auf „Unterpunkt", damit er unter „Ratgeber" hängt. „Menü speichern".
4. Website öffnen: „Ratgeber" mit Aufklappmenü am Desktop, `/ratgeber/` listet den Wasser-Ratgeber.

## Abnahme Stufe 6

| | Prüfpunkt | Geschafft |
|---|---|---|
| 1 | `/ratgeber/` zeigt den Wasser-Ratgeber als Karte mit Link | ☐ |
| 2 | Ein neues Ratgeber-Kapitel anlegen (oder generieren), veröffentlichen: Es steht sofort auf `/ratgeber/`, ohne dass du die Übersicht anfasst | ☐ |
| 3 | Das Kapitel wieder auf „Entwurf" setzen: Es verschwindet von `/ratgeber/` | ☐ |
| 4 | Im Menü hängt der Wasser-Ratgeber unter „Ratgeber"; am Desktop klappt es auf, am Telefon führt „Ratgeber" zur Übersicht | ☐ |
| 5 | Im Cockpit hat der Baustein „Übersicht" ein Auswahlfeld für den Seitentyp; „Seite" wählen und speichern zeigt in der Vorschau Über uns und Kontakt, dann zurück auf „Ratgeber" | ☐ |

Wenn alle fünf Haken stehen, ist Stufe 6 abgenommen. Das erste neue Kapitel, das sich anbietet:
„Winterfest machen" — per „Generieren" aus deinen Stichworten, sobald der Schlüssel eingetragen ist.
