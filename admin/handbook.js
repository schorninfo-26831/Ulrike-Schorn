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
    titel: 'Eine Seite generieren lassen (Stufe 4)',
    wann: 'Du hast Notizen, ein Diktat, Stichworte oder einen alten Text und willst daraus einen Seitenentwurf.',
    schritte: [
      'Einmalig: den Anthropic-Schlüssel in die Datei .env eintragen (Zeile ANTHROPIC_API_KEY=…) und den Motor neu starten. Der Schlüssel bleibt auf deinem Rechner. Wie das geht, steht in docs/lokal-starten.md.',
      'Links „Generieren" öffnen. Seitentyp wählen, Arbeitstitel eingeben, unter „Quelle" alles hineinschreiben oder einfügen, was auf die Seite soll. Stichworte reichen.',
      '„Generieren lassen" drücken und ein bis zwei Minuten warten.',
      'Die Hinweise aus der Prüfung lesen (Zahlen, unbekannte Fakten, verbotene Wörter, ergänzter Pflichthinweis). Dann „Seite öffnen": Sie steht als „generiert" im Cockpit und wird wie jede andere Seite gelesen, bearbeitet und erst dann veröffentlicht.',
      'Eine bestehende Seite neu schreiben lassen: im Editor oben „Neu generieren", Quelle eingeben. Bei einer von Hand bearbeiteten Seite fragt das Cockpit vorher, weil das Ergebnis alle Bausteine ersetzt.',
    ],
    automatisch: [
      'Der Generator bekommt deine Quelle, die erlaubten Bausteine des Seitentyps, die Goldreferenz und deine Stimme (knowledge/voice.md, Compliance, Shop-Ziele) und liefert nur JSON — nie HTML.',
      'Der Vertrag des Seitentyps wird geprüft, bevor etwas gespeichert wird. Ein Ergebnis, das ihn verletzt, wird verworfen, mit Meldung.',
      'Telefon, Anschrift, Öffnungszeiten setzt das Modell als {{facts.…}}-Platzhalter; die Werte kommen aus „Fakten". Nennt der Text ein Biozidprodukt, setzt der Motor den Pflichthinweis-Baustein von allein.',
      'Der Status ist immer „generiert", nie „veröffentlicht". Ein Mensch entscheidet.',
    ],
    fallstricke: [
      'Ohne Schlüssel in .env steht unter „Generieren" ein Hinweis, und der Knopf bleibt aus. Alles andere läuft weiter.',
      'Jeder Lauf kostet beim Anbieter Geld, im Cent-Bereich pro Seite. Der Verbrauch steht nach jedem Lauf dabei.',
      'Zahlen im Text sind ein Hinweis, kein Fehler. Prüf sie: Nur freigegebene Angaben (etwa „bis zu 6 Monate") dürfen stehen.',
      'Veröffentlichte Seiten werden nie neu generiert; sonst ginge ungelesener Text sofort live. Leg dafür eine neue Seite an.',
    ],
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
    fallstricke: ['Solange der Mailversand nicht eingerichtet ist (Ablauf „Mailversand einrichten"), ist diese Liste der einzige Ort, an dem Anfragen sichtbar sind — täglich reinschauen.'],
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
  {
    titel: 'Mailversand einrichten (Anfragen per E-Mail)',
    wann: 'Sobald die Seite öffentlich ist, sollen neue Anfragen nicht nur im Cockpit liegen, sondern auch in deinem Postfach landen.',
    schritte: [
      'Von deinem E-Mail-Anbieter brauchst du den SMTP-Zugang: Server, Port, Benutzername, Passwort.',
      'In die Datei .env eintragen: SMTP_URL=smtps://benutzer:passwort@server:465 (Sonderzeichen im Passwort URL-kodiert, z. B. @ als %40), MAIL_TO=deine Adresse, optional MAIL_FROM.',
      'Motor neu starten. Unter „Anfragen" steht dann „Mailversand eingerichtet".',
      'Auf der Website /kontakt/ eine Testanfrage abschicken und im Postfach nachsehen.',
    ],
    automatisch: ['Jede Anfrage wird ZUERST gespeichert, DANN verschickt. Klemmt der Versand, steht sie trotzdem unter „Anfragen", und im Motor-Log steht, warum.', 'Antworten geht direkt: die Mail trägt die Adresse aus dem Formular als Antwort-Adresse.'],
    fallstricke: ['Zugangsdaten gehören nur in .env — nie ins Repository, nie in einen Chat.', 'Bei Weg B (Hoster) stehen diese Werte in der Oberfläche des Hosters, nicht in einer Datei im Projekt.'],
  },
  {
    titel: 'Zugriffe lesen',
    wann: 'Du willst wissen, was gelesen wird.',
    schritte: ['„Zugriffe" öffnen: oben die letzten 30 Tage, darunter die Aufrufe je Seite.'],
    automatisch: ['Gezählt wird je Tag und Adresse, ohne IP-Adresse, ohne Cookie, ohne Browserkennung. Bekannte Bots zählen nicht. Deshalb braucht es weder Banner noch Einwilligung.'],
    fallstricke: ['Die Zahlen sind Aufrufe, keine Besucher: wer eine Seite dreimal öffnet, zählt dreimal.', 'Entwürfe und die Vorschau zählen nicht — nur die veröffentlichte Seite.'],
  },
  {
    titel: 'Die Website zeigen, bevor sie eine Domain hat (Weg A, Tunnel)',
    wann: 'Du willst die Seite jemandem zeigen, der nicht an deinem Mac sitzt: Justus zur Prüfung, jemandem aus der Schulung, einem Kunden.',
    schritte: [
      'Motor starten (npm start). In einem zweiten Terminal-Fenster: cloudflared tunnel --url http://localhost:3000 (einmalige Einrichtung steht in docs/veroeffentlichen.md).',
      'Im Terminal erscheint eine Adresse wie https://irgendwas.trycloudflare.com. Die schickst du weiter.',
      'Zum Beenden Ctrl + C im Tunnel-Fenster. Die Adresse ist danach tot.',
    ],
    automatisch: ['Sitemap, robots.txt und die Vorschaubilder fürs Teilen nehmen von allein die Adresse des Tunnels.', 'Das Cockpit ist über den Tunnel mit erreichbar, geschützt durch dein Passwort und die Bremse gegen Passwort-Raten.'],
    fallstricke: ['Ein Tunnel ist zum Zeigen, nicht zum Dauerbetrieb: Läuft der Mac nicht, ist die Seite weg.', 'Für den echten Betrieb ist Weg B da (docs/veroeffentlichen.md).'],
  },
];
