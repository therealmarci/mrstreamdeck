# Häufige Fragen

## Die Taste zeigt „Offline“
Der Server antwortet nicht unter der eingetragenen Adresse. Prüfe die **Server-Adresse** in den Einstellungen der Taste - sie muss genau die sein, unter der du die Weboberfläche im Browser öffnest (mit `https://`). Läuft der Server gerade neu, kommt die Anzeige nach dem Start von selbst wieder. Ein Druck auf die Taste versucht es sofort nochmal.

## Die Taste zeigt „Kein Recht“
Dir fehlt das Recht für diese Taste. Bei allen Tasten: `mradmin.deck`. Bei Team-Tasten zusätzlich das Recht der Seite **und** eine eigene Anmeldung in der Weboberfläche (siehe [Tasten fürs Team](team-tasten.md)).

## Der Code wird nicht angenommen
Ein Code gilt **5 Minuten** und nur einmal. Klick in den Einstellungen der Taste einfach nochmal auf **Mit Code verbinden**.

## Wie oft fragt das Stream Deck?
Alle 3 Sekunden, und nur solange eine MRadmin-Taste sichtbar ist. Der Server hält die Antwort kurz vor - auch viele Stream Decks belasten ihn kaum.

## Wo ist mein Schlüssel gespeichert?
In den Einstellungen der Stream-Deck-App auf deinem Rechner. Der Server kennt nur einen Hash davon. Ins Log schreibt das Plugin ihn nie.

## Geht es auch mit mehreren Servern?
Im Moment verbindet sich das Plugin mit **einem** Server.
