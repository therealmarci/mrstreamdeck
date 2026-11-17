# Verbinden

Das Stream Deck verbindet sich mit der **Weboberfläche von MRadmin** deines Servers - mit deinem Konto. Es bekommt dafür einen eigenen Schlüssel, der nur für das Stream Deck gilt und nicht abläuft.

## Mit Code
1. In den Einstellungen einer MRadmin-Taste die **Server-Adresse** eintragen (die Adresse, unter der du die Weboberfläche im Browser öffnest) und optional einen **Namen** für dieses Stream Deck (z.B. „Schreibtisch“).
2. **Mit Code verbinden** - alle MRadmin-Tasten zeigen den Code, z.B. `K7Q-4MX`. Er gilt **5 Minuten**.
3. Bestätigen:
   - **im Spiel** mit `/web link K7Q-4MX` und Klick auf **[Nur anzeigen]** oder **[Anzeigen und schalten]** - der Hover zeigt Name und Adresse des Stream Decks, oder
   - **im Browser:** **Im Browser bestätigen** (oder eine Taste drücken, solange sie den Code zeigt) öffnet die Weboberfläche; nach dem Anmelden auf **Verbinden** klicken (Häkchen „Darf auch schalten“ nach Wunsch).

## Nur anzeigen oder auch schalten
Ein Stream Deck **zeigt nur an**, solange du ihm das Schalten nicht ausdrücklich erlaubst. Erst mit **Anzeigen und schalten** darf es Chunkloader schalten und - mit Team-Rechten - Neustarts, den Admin-Modus und Ankündigungen auslösen. Tasten mit Wirkung zeigen sonst „nur anzeigen“ und lehnen ab. Ändern kannst du das jederzeit unter **Konto → Geräte → Stream Deck** (**Schalten erlauben** / **Nur anzeigen**); die Einstellungen jeder Taste zeigen den aktuellen Stand.

## Mit Schlüssel
In der Weboberfläche unter **Konto → Geräte → Stream Deck** einen Namen eingeben, wenn gewünscht **Darf auch schalten** ankreuzen und **Schlüssel erzeugen**. Der Schlüssel (`mrd_…`) wird **nur einmal** angezeigt - kopieren und in den Einstellungen der Taste unter **Mit Schlüssel verbinden** einfügen.

## Trennen und abmelden
- **Am Stream Deck:** in den Einstellungen einer Taste **Trennen** - das meldet das Stream Deck auch am Server ab.
- **In der Weboberfläche:** **Konto → Geräte → Stream Deck → Abmelden** (z.B. wenn das Stream Deck nicht mehr dir gehört).
- **Im Spiel:** `/web devices` zeigt, wie viele Stream Decks verbunden sind; `/web reset` meldet alle Geräte samt Stream Decks ab.

## Was die Tasten zeigen
| Anzeige | Bedeutung |
|---|---|
| **Verbinden** | noch nicht verbunden - Einstellungen der Taste öffnen |
| **Code** | wartet auf deine Bestätigung |
| **Offline** | der Server antwortet nicht (Drücken versucht es sofort nochmal) |
| **Abgemeldet** | das Stream Deck wurde abgemeldet - neu verbinden |
| **Kein Recht** | dir fehlt das Recht für diese Taste (bei allen Tasten: `mradmin.deck`) |
| **Aus** | Stream Decks sind auf dem Server ausgeschaltet |
| **nur anzeigen** (unten auf einer Taste) | dieses Stream Deck darf nicht schalten - siehe oben |

## Fürs Team am Server
- MRadmin braucht die **Weboberfläche** (`web.enabled: true`) mit **öffentlicher Adresse** (`web.public-url`).
- `stream-deck.enabled` (Standard an) erlaubt Stream Decks, `stream-deck.max-devices` (Standard 5) begrenzt sie pro Spieler.
- Recht **`mradmin.deck`** (in `mradmin.player`) erlaubt das Verbinden. Was eine Taste zeigt, hängt an den Rechten der Weboberfläche - [Tasten fürs Team](team-tasten.md) brauchen zusätzlich **`mradmin.deck.team`** (in `mradmin.groups.support`) und eine eigene Anmeldung in der Weboberfläche (Passwort, Passkey oder Discord), wie die Verwaltung selbst.
- Neustart, Admin-Modus und Ankündigung vom Stream Deck stehen im Protokoll, im Discord-Admin-Log (Ereignis `deck-action`) und als Team-Meldung „Aktionen am Stream Deck“ im Posteingang.
- Alles Weitere: [MRadmin-Wiki](https://mrtechnology.marcelr.at/wiki/mradmin/).
