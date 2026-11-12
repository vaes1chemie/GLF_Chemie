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

### Pro Doppellektion freischalten (Struktur & Eigenschaften, Phase 2–4)
Statt eines Werts für die ganze Phase kann man jede Doppellektion einzeln freigeben. Die Nummern entsprechen der Lektionsplanung:

| Phase | Doppellektionen |
|---|---|
| 2 Gitterstoffe | `DL1` (L5–6, Labor) · `DL2` (L7 + L8) · `DL3` (L9 + L10) |
| 3 Moleküle | `DL4` (L11–12, Labor) · `DL5` (L13 + L14) |
| 4 Lösen und Mischen | `DL6` (L15–16, Labor) · `DL7` (L17 + L18) |

```json
"struktur": { "1": "frei",
              "2": { "DL1": "frei", "DL2": "2026-12-01", "DL3": "gesperrt" },
              "3": "gesperrt",
              "4": "gesperrt" }
```

- Eine Phase ist sichtbar, sobald mindestens eine ihrer Doppellektionen frei ist. Gesperrte Doppellektionen erscheinen mit Schloss; ihr Inhalt ist ausgeblendet.
- Die Zusammenfassung und die Lernkontrolle einer Phase gehören zur letzten Doppellektion der Phase.
- `"2": "frei"` schaltet weiterhin die ganze Phase auf einmal frei.
- Die Klassen-Startseite zeigt bei jeder Phase die einzelnen Doppellektionen mit ihrem Status.

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

## Struktur & Eigenschaften, Phase 2–4
- `struktur-phase2.html`, `-phase3.html`, `-phase4.html` teilen sich das Aussehen (`struktur.css`) und die Funktionen (`phase-tools.js`).
- Link zur MS-Forms-Lernkontrolle: in der jeweiligen Seite ganz unten die Zeile `window.PAGE = { key: 'struktur-2', forms: '' };` suchen und den Link zwischen die leeren Anführungszeichen bei `forms` setzen. Leer = der Block bleibt unsichtbar.

## Hinweis
GitHub Pages ist öffentlich. Gesperrte Phasen sind nur versteckt, nicht geschützt.
