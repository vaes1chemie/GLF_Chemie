# Freigabe pro Klasse – Anleitung

## Links für die Klassen
- Klasse 2029E: https://vaes1chemie.github.io/GLF_Chemie/2029e/
- Testklasse:   https://vaes1chemie.github.io/GLF_Chemie/test/

## Phasen freischalten
Jede Klasse hat einen eigenen Ordner mit der Datei `freigabe.json`, z. B. `2029e/freigabe.json`:

```json
{
  "klasse": "2029E",
  "themen": {
    "atombau":  { "1": "frei", "2": "frei", "3": "frei", "4": "frei" },
    "struktur": { "1": "frei", "2": "2026-12-01", "3": "gesperrt", "4": "gesperrt" }
  }
}
```

Mögliche Werte pro Phase:
- `"frei"` – sofort sichtbar
- `"gesperrt"` – nicht sichtbar
- `"2026-12-01"` – wird an diesem Tag automatisch freigeschaltet (Format JJJJ-MM-TT)

Auf github.com: Datei öffnen → Stift-Symbol → Wert ändern → «Commit changes». Nach 1–2 Minuten ist die Änderung online.
Achtung: Anführungszeichen und Kommas müssen stehen bleiben. Bei einem Tippfehler zeigt die Klassenseite eine Fehlermeldung.

## Neue Klasse anlegen
1. Einen bestehenden Klassenordner kopieren, z. B. `test/` → `2030e/` (Ordnername klein geschrieben).
2. In `2030e/freigabe.json` den Klassennamen und die Freigaben anpassen.
3. Link an die Klasse: https://vaes1chemie.github.io/GLF_Chemie/2030e/

`index.html` im Klassenordner ist für alle Klassen identisch und muss nicht verändert werden.

## Neues Thema oder neue Phase
- Inhaltsseiten liegen im Hauptordner und heissen `thema.html`, `thema-phase2.html`, `thema-phase3.html` …
- Titel und Beschreibung stehen in `themen.js`.
- Jede Inhaltsseite bindet am Ende `<script src="freigabe.js"></script>` ein.

## Hinweis
GitHub Pages ist öffentlich. Gesperrte Phasen sind nur versteckt, nicht geschützt.
