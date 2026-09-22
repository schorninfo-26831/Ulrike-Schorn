# Übersicht

Eine Seite, die andere Seiten auflistet. Die Liste schreibt das Modell nicht: Der Baustein `liste`
liest den Bestand bei jedem Aufruf selbst (P3). Im Baustein stehen nur Überschrift, der Seitentyp,
der gelistet wird (`typ`, zum Beispiel `ratgeber`), die Reihenfolge und der Text für den Fall, dass
noch nichts da ist.

Aufbau: `hero` (was der Leser hier findet, ein Knopf in den Shop) · optional ein kurzer `richtext`
zur Einordnung · genau ein `liste`-Baustein · optional ein `tipp` · `cta` · `footer`.
Keine Aufzählung einzelner Seiten im Text, keine Links auf einzelne Kapitel: die kommen aus dem Bestand.
