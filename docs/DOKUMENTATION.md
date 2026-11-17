# Code-Aufbau

MRstreamdeck ist ein Node.js-Plugin für die Stream-Deck-App (`@elgato/streamdeck` 3, SDK-Version 3, Node 24, Stream Deck 7.1+). Es zeigt nur, was MRadmin liefert - alle Rechte prüft der Server.

## Ordner
| Pfad | Inhalt |
|---|---|
| `src/plugin.ts` | registriert alle Aktionen, verbindet mit der Stream-Deck-App |
| `src/lib/connection.ts` | die Verbindung zu MRadmin: globale Einstellungen (`url`, `token`, `player`), Abfrage alle 3 s solange Tasten sichtbar, Verbinden mit Code/Schlüssel, Trennen, `press`, `open` |
| `src/lib/render.ts` | zeichnet Tasten (144 px) und den Drehregler (200 × 100) als SVG-data-URL im MRadmin-Look |
| `src/lib/i18n.ts`, `format.ts` | Texte DE/EN (nach der Sprache der App), Countdown und Zahlen |
| `src/actions/base.ts` | `MRadminAction`: Zustände (Verbinden, Code, Offline …), Zeichnen, zweimal drücken (`confirm`), `act` (Druck an MRadmin mit ✓/⚠), Nachrichten des Einstellungsfensters |
| `src/actions/*.ts` | die Tasten: `server`, `tickets`, `player` (Posteingang, Countdown, Statistik, Schlaf), `team` (Leistung, Warnungen, Wartung, Warteraum, Staff-Chat, Admin-Modus, Neustart, Ankündigung), `plugins` (Tasten der Module), `dial` |
| `at.marcelr.mradmin.sdPlugin/` | das Plugin: `manifest.json` (+ `de.json`), `ui/settings.*` (Einstellungsfenster, eigener WebSocket-Code ohne Fremdbibliothek), `layouts/dial.json`, `imgs/` (aus `npm run icons`) |
| `scripts/` | `icons.mjs` (PNG-Symbole), `set-version.mjs` (Version ins Manifest), `fake-deck.mjs` (Test ohne Stream Deck) |

## Schnittstelle zu MRadmin
`mradmin/src/main/java/at/marcelr/mradmin/web/deck/DeckRoutes.java`:
- ohne Anmeldung: `GET /api/deck/hello`, `POST /api/deck/link {name}` → `{code, poll, url}`, `POST /api/deck/link/poll {poll}` → `pending` / `done` (+ `token`) / `expired`
- mit Schlüssel (`Authorization: Bearer <token>`): `GET /api/deck/state?lang=de|en` (alles für alle Tasten), `POST /api/deck/press {action, …}` (`module`, `staffchat-seen`, `admin-mode`, `restart`, `restart-cancel`, `announce`), `POST /api/deck/logout`
- Tasten anderer Plugins kommen über die Modul-API (`WebModule#deckTiles`/`deckPress`, ab API 17) und erscheinen in `state.tiles`.

Änderungen ohne MRadmin-Gegenstück sind nicht möglich; neue Felder in `state` nur additiv, damit ältere Plugin-Versionen weiterlaufen.

## Bauen und Testen
- `npm install`, `npm run build` (nach `at.marcelr.mradmin.sdPlugin/bin`), `npm run validate`, `npm run pack`
- Zum Ausprobieren den Ordner `at.marcelr.mradmin.sdPlugin` mit `npx streamdeck link at.marcelr.mradmin.sdPlugin` in die Stream-Deck-App hängen, nach dem Bauen `npx streamdeck restart at.marcelr.mradmin`.
- Ohne Stream Deck: `node scripts/fake-deck.mjs <adresse> <schlüssel> <bild.png> server tickets 'stats={"stat":"jumps"}' --press restart` spielt die App, startet das gebaute Plugin und speichert die gezeichneten Tasten als Bild.
- Log: `at.marcelr.mradmin.sdPlugin/logs/` - nie Stufe `trace` (würde den Schlüssel mitschreiben).

## Abhängigkeiten
`zod` (über `@elgato/utils`) ist per `overrides` auf eine Version ohne bekannte Lücke gehoben - beim Aktualisieren des SDK prüfen, ob das noch nötig ist (`npm audit --omit=dev`).
