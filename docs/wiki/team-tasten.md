# Tasten fürs Team

Team-Tasten zeigen dasselbe wie die Verwaltung der Weboberfläche - mit denselben Rechten. Dazu brauchst du **`mradmin.deck.team`** und wie in der Verwaltung eine **eigene Anmeldung** in der Weboberfläche (Passwort, Passkey oder Discord); ohne sie zeigen die Tasten „Kein Recht“. In der Tastenliste der Stream-Deck-App stehen sie unten mit **Team:** davor.

> [!WARNING]
> Tasten mit Wirkung (Neustart, Admin-Modus, Ankündigung) gehen nur, wenn das Stream Deck **schalten darf** - siehe [Verbinden](verbinden.md#nur-anzeigen-oder-auch-schalten). Jede solche Aktion landet im Protokoll, im Discord-Admin-Log und im Posteingang des Teams.

| Taste | Zeigt | Drücken | Recht |
|---|---|---|---|
| **Leistung** | TPS, Tick-Zeit oder RAM (einstellbar) mit Kurve der letzten 10 Minuten | Leistungs-Seite | `mradmin.status.health` |
| **Warnungen** | Anzahl der Warnungen des Dashboards, die dringendste darunter | Übersicht | je Warnung wie im Dashboard |
| **Tickets** | offene Tickets, gelb bei ungelesenen | Tickets | `mradmin.tickets.view` |
| **Chunkloader-Warnungen** | gesperrte, durch Lags abgeschaltete und auffällige Chunkloader | Chunkloader-Seite | `mrchunks.admin.gui` |
| **Duelle zur Prüfung** | Runden, die auf eine Prüfung warten | Prüfen | `mrpvp.admin.review` |
| **Wartung** | läuft (bis wann) oder kommt (in wie lange) | Wartung | `mradmin.maintenance.view` |
| **Warteraum** | online, startet neu oder weg; wie viele warten | Warteraum | `mradmin.status` |
| **Staff-Chat** | neue Nachrichten, die neueste darunter | **als gelesen markieren** | `mradmin.staffchat` |
| **Admin-Modus** | an oder aus (nur wenn du online bist) | **zweimal: umschalten** | `mradmin.mode` |
| **Neustart** | Countdown-Zeit; läuft einer, die Restzeit | **zweimal: starten bzw. abbrechen** | `mradmin.server.restart` |
| **Ankündigung** | die gewählte Vorlage | **zweimal: senden** | `mradmin.announce` |

## Zweimal drücken
Tasten mit Wirkung leuchten beim ersten Druck in ihrer Farbe auf („Nochmal drücken“). Erst ein zweiter Druck **innerhalb von 5 Sekunden** führt die Aktion aus. Danach zeigt das Stream Deck ein Häkchen - oder ein Warndreieck, wenn der Server ablehnt (z.B. schon ein Neustart läuft).

## Neustart
- Die Zeit wählst du in den Einstellungen der Taste aus den normalen Neustart-Zeiten des Servers (`versions.restart-delays`, Standard 15, 30 und 60 Minuten).
- **Notfall-Neustarts** (1 oder 5 Minuten, sofort) gibt es am Stream Deck nicht - die gehen nur im Browser mit erneuter Bestätigung.
- Wartet gerade der Warteraum auf seinen eigenen Neustart, ist die Taste gesperrt.

## Ankündigung
Nur eigene Vorlagen ohne einzusetzende Werte (angelegt unter **Inhalte → Ankündigungen**). Discord bekommt sie, wenn die Vorlage das vorsieht.

## Stream Deck +
| Drehregler | Display | Drehen | Drücken / Tippen |
|---|---|---|---|
| **Team: Leistung live** | breite Kurve der letzten 10 Minuten mit aktuellem Wert | wechselt TPS, Tick-Zeit, RAM | öffnet die Leistungs-Seite |
| **Team: Neustart** | gewählte Countdown-Zeit; läuft einer, die Restzeit als Balken | wählt 15, 30 oder 60 Minuten | **zweimal: starten bzw. abbrechen** |
