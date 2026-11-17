# Releases

## Schema
`STA-<MAJOR>.<MINOR>.<PATCH>-bu<BUILD>` (stabil) bzw. `BET-…` (Beta), z.B. `BET-0.1.0-bu001`. Anders als die Server-Plugins **ohne** `mc<version>-` davor: das Stream-Deck-Plugin hängt an keiner Minecraft-Version, nur an MRadmin. BUILD zählt die Releases einer Version (jede Beta und die Stable, ab `001`); eine Stable schließt ihre Version. `0.x` gibt es nur als Beta. Die Stream-Deck-App bekommt die Version als vier Zahlen (`BET-1.4.0-bu002` → `1.4.0.2`, `scripts/set-version.mjs`).

Versionsnummern legt der User fest.

## Branches
`dev` (Entwicklung) → `beta` (Beta-Release, darf übersprungen werden) → `main` (Stable).

## Ablauf
1. **Beta:** `dev` nach `beta` mergen; `version=BET-…` in `version.properties`, im CHANGELOG `## [Unveröffentlicht]` → `## [BET-…] - <datum>` (Unveröffentlicht bleibt leer stehen), Commit „Pre-Release BET-…“, Tag `BET-…` auf `beta`, pushen.
2. **Stable:** `beta` (bzw. `dev`) mit `git merge --no-ff` nach `main`; `version=STA-…` (nächster Build), im CHANGELOG alle Beta-Abschnitte seit der letzten Stable zu `## [STA-…] - <datum>` zusammenfassen, Commit „Release STA-…“, Tag auf `main`, `main` und Tag pushen.
3. `beta` und `dev` per Fast-Forward nachziehen und pushen.
4. Workflow „Release“ abwarten (`gh run watch`) und prüfen: Release vorhanden, `.streamDeckPlugin` angehängt, Beta als Vorabversion, Stable als „Latest“.

## Prüfrunde
`checks.yml` läuft bei jedem Push und vor jedem Release: bauen, `streamdeck validate`, packen, `npm audit --omit=dev` (ab hoch stoppt es; die Build-Werkzeuge stehen nur in der Zusammenfassung), CodeQL JavaScript/TypeScript (ab hoch stoppt es). Veröffentlicht wird genau die dort gepackte Datei mit Herkunftsnachweis (`gh attestation verify <datei> -R therealmarci/mrstreamdeck`).
