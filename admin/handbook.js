/**
 * Das Handbuch schreibt sich mit (3.6). Jeder Ablauf, den ein Mensch von Hand macht,
 * steht hier mit den ECHTEN Knopfnamen. Ändert ein Commit einen Knopf, wird dieser
 * Eintrag im selben Commit mitgezogen. Die Fallstricke kommen aus echten Vorfällen.
 */
window.HANDBUCH = [
  {
    titel: 'Eine Seite anlegen',
    wann: 'Wenn ein neuer Inhalt eine eigene Adresse braucht — ein Ratgeber-Kapitel, eine Aktionsseite, ein weiterer Rechtstext.',
    schritte: [
      'Links „Seiten" öffnen, oben rechts „Neue Seite".',
      'Seitentyp wählen (Ratgeber, Seite, Rechtstext, Startseite) und einen Titel eingeben. Der Slug — der Teil der Adresse — entsteht aus dem Titel; du kannst ihn ändern.',
      '„Anlegen" drücken. Die Seite öffnet sich zum Bearbeiten, Status „Entwurf".',
    ],
    automatisch: ['Der Motor legt die Pflichtbausteine des Typs an (Kopfzeile, Aufmacher, Fußzeile).', 'Ein Entwurf ist öffentlich nicht erreichbar und trägt noindex.'],
    fallstricke: ['Ein Slug muss eindeutig sein. „Gibt es schon" heißt: eine andere Seite hat ihn — auch ein archivierter Entwurf.'],
  },
  {
    titel: 'Eine Seite bearbeiten',
    wann: 'Text ändern, einen Abschnitt ergänzen, die Reihenfolge ändern.',
    schritte: [
      'In „Seiten" auf „Bearbeiten" der Seite.',
      'Jeder Baustein ist ein Kasten mit Feldern. Die Felder kommen aus dem Bauplan des Bausteins — was hier steht, kann gefüllt werden, mehr gibt es nicht.',
      'Baustein verschieben mit ↑ ↓, entfernen mit ✕. Neuen Baustein unten mit „Baustein hinzufügen".',
      '„Speichern". Zum Ansehen „Vorschau" — sie zeigt auch Entwürfe.',
    ],
    automatisch: ['Speichern prüft den Vertrag des Seitentyps: Pflichtbausteine, erlaubte Bausteine, Bild ohne Alt-Text. Was dagegen verstößt, wird nicht gespeichert, sondern gemeldet.', 'Ein Entwurf wird durch Bearbeiten zu „bearbeitet" (edited). Eine veröffentlichte Seite bleibt veröffentlicht und ist sofort aktuell.'],
    fallstricke: ['Zahlen wie Telefon oder Öffnungszeiten stehen als {{facts.…}} im Text. Die tippst du nicht um — die änderst du unter „Fakten", dann stimmen sie überall.'],
  },
  {
    titel: 'Ein Bild einsetzen',
    wann: 'Ein Foto im Text, ein Aufmacherbild, ein Vorschaubild fürs Teilen.',
    schritte: [
      'Zuerst unter „Medien" hochladen: Datei wählen, Alt-Text eingeben (Pflicht — er beschreibt das Bild für Menschen, die es nicht sehen), „Hochladen".',
      'Dann in der Seite: beim Baustein „Bild" oder beim Bildfeld eines Aufmachers auf „Bild wählen", das Bild anklicken.',
      'Alt-Text prüfen, „Speichern".',
    ],
    automatisch: ['Der Dateiname bekommt einen Inhalts-Hash. Ein neues Bild unter altem Namen kämpft so nie gegen den Browser-Cache.', 'Beim Wählen wird der Alt-Text aus den Medien vorgeschlagen, wenn das Feld leer ist.'],
    fallstricke: ['Erlaubt sind PNG, JPG, WebP, GIF. WebP ist meist ein Fünftel so groß wie PNG — bei Fotos vorher umwandeln.', 'Ein Bild ohne Alt-Text lässt sich nicht speichern. Das ist Absicht.'],
  },
  {
    titel: 'Veröffentlichen',
    wann: 'Wenn eine Seite fertig ist und öffentlich werden soll.',
    schritte: ['Seite öffnen, „Vorschau" ansehen — auch auf dem Telefon.', 'Dann „Veröffentlichen". Fertig.'],
    automatisch: ['Die Seite ist sofort unter ihrer Adresse erreichbar (P7). Kein Deploy, kein Warten.', 'Sitemap und robots.txt kennen sie ab jetzt; Entwürfe stehen dort nie drin.', 'Der Render-Cache wird geleert.'],
    fallstricke: ['„Veröffentlichen" ist ein Status, kein Knopf, der den Text prüft. Lies vorher.'],
  },
  {
    titel: 'Eine Seite umbenennen (Adresse ändern)',
    wann: 'Wenn der Slug besser passen soll, z. B. /wasser/ statt /wasser-ratgeber/.',
    schritte: ['Seite öffnen, Feld „Slug" ändern, „Speichern".'],
    automatisch: ['Ist die Seite veröffentlicht, legt der Motor **ungefragt** eine Umleitung (301) von der alten zur neuen Adresse an. Du siehst sie unter „Umleitungen".'],
    fallstricke: ['Ohne diese Umleitung würde jeder alte Link — Google, Newsletter, Visitenkarte — ins Leere laufen. Deshalb ist sie kein Häkchen, sondern Pflicht.'],
  },
  {
    titel: 'Eine Seite löschen',
    wann: 'Wenn ein Inhalt endgültig weg soll. Überleg vorher, ob „archiviert" reicht.',
    schritte: ['Seite öffnen, unten „Löschen".', 'Bei einer veröffentlichten Seite fragt das Cockpit nach einem Umleitungsziel, z. B. /wasser-ratgeber/. Ohne Ziel wird nicht gelöscht.', 'Bestätigen.'],
    automatisch: ['Menüpunkte, die auf die gelöschte Seite zeigen, werden auf der Website versteckt. Unter „Navigation" siehst du eine Warnung daran.'],
    fallstricke: ['Die Startseite lässt sich nicht löschen.'],
  },
  {
    titel: 'Das Menü pflegen',
    wann: 'Eine neue Seite soll ins Menü, die Reihenfolge soll anders, ein externer Link dazu.',
    schritte: [
      '„Navigation" öffnen. Links stehen alle veröffentlichten Seiten, rechts das Menü.',
      'Bei einer Seite links auf „+" — sie landet unten im Menü. „Externer Link" für Ziele außerhalb (z. B. der Shop).',
      'Reihenfolge mit ↑ ↓. „Unterpunkt" hängt einen zweiten Punkt unter einen Hauptpunkt. ✕ entfernt.',
      '„Menü speichern".',
    ],
    automatisch: ['Kopf- und Fußzeile jeder Seite lesen das Menü bei jedem Aufruf aus der Datenbank (P3). Nichts ist im Baustein fest verdrahtet.', 'Punkte, deren Ziel nicht veröffentlicht ist, werden versteckt statt ins Leere zu führen.'],
    fallstricke: ['Die Reihenfolge ist Redaktion, keine Technik: nie alphabetisch, nie nach Datum.', 'Zwei Ebenen reichen. Eine dritte gibt es bewusst nicht.'],
  },
  {
    titel: 'Anfragen lesen',
    wann: 'Jemand hat das Kontaktformular abgeschickt.',
    schritte: ['„Anfragen" öffnen — die Zahl daneben sagt, wie viele ungelesen sind.', 'Auf eine Zeile klicken: Details erscheinen, die Anfrage gilt als gelesen. „Als ungelesen markieren" macht das rückgängig.'],
    automatisch: ['Jede Anfrage wird ZUERST gespeichert, DANN verschickt. Klemmt der Mailversand, liegt sie trotzdem hier.', 'Ein verstecktes Feld fängt Bots ab; deren Einträge landen gar nicht erst in der Liste.'],
    fallstricke: ['Mailversand ist noch nicht eingerichtet. Bis dahin ist diese Liste der einzige Ort, an dem Anfragen sichtbar sind — täglich reinschauen.'],
  },
  {
    titel: 'Einen Fakt ändern (Telefon, Öffnungszeiten, E-Mail …)',
    wann: 'Wenn sich eine Angabe ändert, die auf mehreren Seiten steht.',
    schritte: ['„Fakten" öffnen, den Wert ändern, „Fakten speichern".'],
    automatisch: ['Der Wert gilt sofort auf jeder Seite, die ihn als {{facts.…}} verwendet. Kein Deploy, kein Suchen-und-Ersetzen.', 'Ein leerer Wert erscheint auf der Seite sichtbar als […] — besser eine Lücke, die auffällt, als eine falsche Zahl.'],
    fallstricke: ['Was du hier änderst, überschattet die Datei config/facts.json. Ein neues Feld, das ein Entwickler nur in die Datei schreibt, erscheint trotzdem — solange du es hier nicht überschrieben hast.'],
  },
  {
    titel: 'Eine Umleitung von Hand anlegen',
    wann: 'Eine alte Adresse (z. B. von der Shopify-Seite) soll auf eine neue zeigen.',
    schritte: ['„Umleitungen" öffnen, „von" und „nach" eintragen (z. B. /alte-seite/ → /wasser-ratgeber/), „Umleitung anlegen".'],
    automatisch: ['Umleitungen durch Umbenennen und Löschen stehen hier von allein.'],
    fallstricke: ['„von" ist immer ein Pfad dieser Website. „nach" darf auch eine volle https-Adresse sein, z. B. in den Shop.'],
  },
];
