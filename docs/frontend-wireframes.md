# Frontend Wireframes

## TravelDashboardView Struktur

```text
TravelDashboardView
|-- Header
|   |-- Projektname
|   |-- Demo-Reise laden
|   `-- Regen an Tag 2 simulieren
|-- Main Dashboard Grid
|   |-- ChatPanel
|   |-- DayPlanPanel
|   |-- BudgetPanel
|   |-- RouteMapPanel
|   |-- ChecklistPanel
|   `-- AgentInsightsPanel
`-- ReplanningProposalPanel
```

## Desktop-Layout-Skizze

```text
+--------------------------------------------------------------------------------+
| Reiseplanungs-Agent                    [Demo-Reise laden] [Regen Tag 2]         |
+--------------------------+--------------------------------------+--------------+
| ChatPanel                | DayPlanPanel                         | BudgetPanel  |
|                          |                                      |              |
| Eingabe, Verlauf,        | Tag 1 | Tag 2 | Tag 3                | Gesamt,      |
| Agentenantworten         | Zeitfenster und Aktivitaeten         | Kategorien   |
+--------------------------+--------------------------------------+--------------+
| RouteMapPanel            | ChecklistPanel                       | AgentInsights|
| Schematische Route       | Packen, Dokumente, Vorbereitung      | Agentenlog   |
+--------------------------+--------------------------------------+--------------+
| ReplanningProposalPanel: erscheint nur bei pending Proposal                    |
+--------------------------------------------------------------------------------+
```

## Header

| Aspekt | Beschreibung |
| --- | --- |
| Zweck | Demo-Steuerung und klare Produktidentitaet |
| Angezeigte Daten | Projektname, aktiver Trip-Status |
| Nutzeraktionen | "Demo-Reise laden", "Regen an Tag 2 simulieren" |
| Ladezustand | Buttons deaktiviert, wenn Planung oder Replanning laeuft |
| Fehlerzustand | Kurze Fehlermeldung bei fehlender Demo oder API-Fehler |
| MVP-1-Vereinfachung | Keine Benutzerkonten, keine Navigation zu weiteren Bereichen |

## ChatPanel

| Aspekt | Beschreibung |
| --- | --- |
| Zweck | Dialogische Eingabe und Erklaerungen des Agenten |
| Angezeigte Daten | Nutzer- und Agentennachrichten, Status wie "Budget wird geprueft" |
| Nutzeraktionen | Nachricht senden, Folgefrage stellen |
| Ladezustand | Schreibfeld deaktiviert, Agentenstatus sichtbar |
| Fehlerzustand | Nachricht konnte nicht verarbeitet werden |
| MVP-1-Vereinfachung | Chat muss nicht alle freien Sonderfaelle perfekt loesen |

## DayPlanPanel

| Aspekt | Beschreibung |
| --- | --- |
| Zweck | Zentraler Reiseplan nach Tagen und Zeitfenstern |
| Angezeigte Daten | Tag, Uhrzeit, Aktivitaet, Kategorie, Kosten, Ort, Indoor/Outdoor, Begruendung |
| Nutzeraktionen | Tag auswaehlen, Aktivitaetsdetails ansehen |
| Ladezustand | Skeleton oder Platzhalter waehrend Planung |
| Fehlerzustand | Hinweis, wenn kein Plan erstellt werden konnte |
| MVP-1-Vereinfachung | Keine Drag-and-drop Bearbeitung |

## BudgetPanel

| Aspekt | Beschreibung |
| --- | --- |
| Zweck | Budgettransparenz fuer die Tagesplanung vor Ort |
| Angezeigte Daten | Gesamtbudget, geplante Kosten, Restbudget, Kategorien |
| Nutzeraktionen | Keine direkte Bearbeitung in MVP 1 |
| Ladezustand | Berechnung laeuft |
| Fehlerzustand | Budget konnte nicht berechnet werden |
| MVP-1-Vereinfachung | Unterkunft und Anreise sind nicht enthalten |

## RouteMapPanel

| Aspekt | Beschreibung |
| --- | --- |
| Zweck | Grobe Orientierung ueber Orte und Tagesroute |
| Angezeigte Daten | Mock-Orte, Stadtbereiche, einfache Reihenfolge |
| Nutzeraktionen | Tag auswaehlen oder Ort markieren |
| Ladezustand | Platzhalterkarte |
| Fehlerzustand | Ortsdaten fehlen |
| MVP-1-Vereinfachung | Keine echte Google Maps Integration und keine echte Routenoptimierung |

## ChecklistPanel

| Aspekt | Beschreibung |
| --- | --- |
| Zweck | Reisevorbereitung sichtbar machen |
| Angezeigte Daten | Packliste, Dokumente, Buchung, Vorbereitung |
| Nutzeraktionen | Punkte abhaken |
| Ladezustand | Liste wird erstellt |
| Fehlerzustand | Checkliste konnte nicht aktualisiert werden |
| MVP-1-Vereinfachung | Einfache Liste ohne Fristen oder Erinnerungen |

## AgentInsightsPanel

| Aspekt | Beschreibung |
| --- | --- |
| Zweck | Agentenarchitektur fuer die Demo sichtbar machen |
| Angezeigte Daten | Agentname, Status, kurze Aktion, z. B. "Planning Agent: Tagesstruktur erstellt" |
| Nutzeraktionen | Keine, read-only |
| Ladezustand | Agent mit Status `running` hervorheben |
| Fehlerzustand | Agent mit Status `failed` markieren |
| MVP-1-Vereinfachung | Keine vollstaendige technische Trace-Ansicht |

## ReplanningProposalPanel

| Aspekt | Beschreibung |
| --- | --- |
| Zweck | Pending Aenderungen vergleichen und bestaetigen |
| Angezeigte Daten | Grund, entfernte Aktivitaeten, neue Aktivitaeten, Budget-Differenz, Begruendung |
| Nutzeraktionen | "Aenderungen uebernehmen", "Ablehnen" |
| Ladezustand | Aktion laeuft |
| Fehlerzustand | Vorschlag konnte nicht angewendet oder abgelehnt werden |
| MVP-1-Vereinfachung | Nur ein pending Proposal gleichzeitig |
