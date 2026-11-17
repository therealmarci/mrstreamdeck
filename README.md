# MRstreamdeck

**MRadmin auf dem Stream Deck - dein Minecraft-Server auf deinen Tasten.**

[Download](https://mrtechnology.marcelr.at/download/mrstreamdeck/) · [Wiki](https://mrtechnology.marcelr.at/wiki/mrstreamdeck/) · [Fehler melden](https://mrtechnology.marcelr.at/report/mrstreamdeck/)

> [!NOTE]
> In Entwicklung - noch kein Release.

## Auf einen Blick
- Plugin für das **Elgato Stream Deck** (Stream Deck 7.1 oder neuer, Windows und macOS)
- Braucht einen Server mit **MRadmin** und eingeschalteter Weboberfläche
- Für Spieler und das Team - jede Taste zeigt nur, was du auch in der Weboberfläche siehst

## Was kann MRstreamdeck?
- **Für Spieler:** Server-Übersicht, Tickets, Posteingang, nächster Neustart, Statistik, Schlafabstimmung, Chunkloader an/aus, letztes Duell
- **Fürs Team:** Leistung mit Kurve, Warnungen, Chunkloader-Warnungen, Duelle zur Prüfung, Wartung, Warteraum, Staff-Chat, Admin-Modus, Neustart, Ankündigung
- **Stream Deck +:** Überblick auf dem Drehregler

## Schnellstart
1. Plugin installieren (Doppelklick auf die `.streamDeckPlugin`-Datei).
2. Eine MRadmin-Taste aufs Stream Deck ziehen, Server-Adresse eintragen, **Mit Code verbinden**.
3. Den Code im Spiel mit `/web link <Code>` bestätigen - fertig.

## Anleitung
| Thema | Wiki |
|---|---|
| Installieren und verbinden | [Schnellstart](https://mrtechnology.marcelr.at/wiki/mrstreamdeck/schnellstart/), [Verbinden](https://mrtechnology.marcelr.at/wiki/mrstreamdeck/verbinden/) |
| Alle Tasten | [für Spieler](https://mrtechnology.marcelr.at/wiki/mrstreamdeck/tasten/), [fürs Team](https://mrtechnology.marcelr.at/wiki/mrstreamdeck/team-tasten/) |
| Probleme | [Häufige Fragen](https://mrtechnology.marcelr.at/wiki/mrstreamdeck/faq/) |

## Lizenz
[MRtechnology Lizenz 1.0](LICENSE)

## Für Entwickler
`npm install`, `npm run build` (Plugin nach `at.marcelr.mradmin.sdPlugin/bin`), `npm run icons` (Symbole), `npm run validate`, `npm run pack` (`.streamDeckPlugin` nach `dist/`). Die Daten kommen von MRadmin (`/api/deck/...`, siehe `mradmin/src/main/java/at/marcelr/mradmin/web/deck/DeckRoutes.java`); Plugins liefern eigene Tasten über die Modul-API (`deckTiles`, ab API 17).
