# Design System MVP 1

## Design-Ziel

Die Anwendung soll wie ein moderner Reiseassistent wirken:

- vertrauenswuerdig
- strukturiert
- technisch hochwertig
- ruhig und demo-tauglich
- hilfreich, ohne wie ein reiner Chatbot zu wirken

Der visuelle Schwerpunkt liegt auf dem Tagesplan. Chat, Budget, Route, Checkliste und Agent Insights unterstuetzen die Planung.

## Layout-Prinzipien

| Prinzip | Beschreibung |
| --- | --- |
| Dashboard-zentriert | Alle wichtigen Informationen sind parallel sichtbar. |
| Tagesplan als Zentrum | `DayPlanPanel` ist der groesste und wichtigste Bereich. |
| Chat als Assistenzbereich | Chat ist links oder in einer klar begrenzten Spalte sichtbar. |
| Agent Insights sichtbar | Agentenschritte sind erkennbar, aber nicht dominanter als Plan und Budget. |
| Replanning klar hervorheben | Pending Proposal erscheint visuell getrennt und entscheidungsorientiert. |
| Keine Marketing-Seite | Die erste Ansicht ist die nutzbare App. |

## Farbpalette

### Semantische Farben

| Rolle | Farbe | Nutzung |
| --- | --- | --- |
| Primary Action | `#2563EB` | Hauptbuttons, aktive Tabs, primaere Highlights |
| Secondary Action | `#64748B` | Sekundaere Buttons, neutrale Aktionen |
| Background | `#F8FAFC` | Seitenhintergrund |
| Surface/Card | `#FFFFFF` | Panels, Cards, Eingabefelder |
| Text Primary | `#0F172A` | Haupttext |
| Text Secondary | `#475569` | Hilfstexte, Metadaten |
| Border | `#E2E8F0` | Panel- und Kartenlinien |
| Success | `#16A34A` | Erfolgsstatus, hinzugefuegte Aktivitaeten |
| Warning | `#F59E0B` | Warnungen, pending Proposal |
| Error | `#DC2626` | Fehler, entfernte Aktivitaeten |
| Info | `#0EA5E9` | verschobene Aktivitaeten, neutrale Hinweise |

### Budgetstatus

| Status | Farbe | Darstellung |
| --- | --- | --- |
| `within_budget` | `#16A34A` | Gruener Statuschip, positive Budgetanzeige |
| `near_limit` | `#F59E0B` | Orangener Statuschip, dezente Warnung |
| `over_budget` | `#DC2626` | Roter Statuschip, klare Warnung |

### Replanning

| Zustand | Farbe | Darstellung |
| --- | --- | --- |
| removed activity | `#DC2626` mit hellem Hintergrund `#FEE2E2` | rot/leicht transparent |
| added activity | `#16A34A` mit hellem Hintergrund `#DCFCE7` | gruen/leicht transparent |
| moved activity | `#0EA5E9` mit hellem Hintergrund `#E0F2FE` | blau/leicht transparent |
| pending proposal | `#F59E0B` mit hellem Hintergrund `#FEF3C7` | gelb/orange Akzent |

## Typografie

| Rolle | Groesse | Gewicht | Nutzung |
| --- | --- | --- | --- |
| Headline | 28-32px | 700 | Seitentitel oder Dashboard-Header |
| Section Title | 18-20px | 650 | Panel-Ueberschriften |
| Card Title | 15-16px | 600 | Aktivitaets- und Budgetkarten |
| Body Text | 14-16px | 400 | Standardtext |
| Meta Text | 12-13px | 400 | Zeit, Kategorie, Ort, Agentenstatus |
| Button Text | 14px | 600 | Buttons und Tabs |

Regeln:

- Keine negativen Letter-Spacings.
- Keine hero-grossen Texte im Dashboard.
- Meta Text muss lesbar bleiben und darf nicht als graue Fussnote verschwinden.

## Komponenten-Stil

### Buttons

| Typ | Stil |
| --- | --- |
| Primary | blauer Hintergrund, weisser Text, Radius 8px, klare Hover- und Disabled-Zustaende |
| Secondary | heller Hintergrund, Slate-Text, Border |
| Destructive | roter Akzent fuer Ablehnen nur, wenn echte destruktive Wirkung entsteht |
| Demo Button | Primary oder Secondary, im Header sichtbar |

Buttons sollen kurz benannt sein: "Demo-Reise laden", "Regen an Tag 2 simulieren", "Aenderungen uebernehmen", "Ablehnen".

### Cards

- Radius maximal 8px.
- Dezente Border statt schwerer Schatten.
- Keine verschachtelten Karten.
- Cards fuer wiederholte Elemente wie Aktivitaeten, Budgetkategorien und PlanChanges.

### Panels

- Panels sind klare Dashboard-Bereiche.
- Jedes Panel hat Titel, Inhalt und optional Statuszeile.
- Panels sollen kompakt sein und keine Marketingtexte enthalten.

### Chat Bubbles

| Sender | Darstellung |
| --- | --- |
| Nutzer | rechts ausgerichtet, Primary-Tint oder klare Border |
| Agent | links ausgerichtet, Surface/Card, Border |
| Systemstatus | kompakte Meta-Zeile, kein grosser Bubble |

Chat-Bubbles duerfen nicht die ganze App dominieren.

### Day Plan Items

- Zeitfenster links oder oben sichtbar.
- Aktivitaetsname als Card Title.
- Kategorie, Ort, Kosten und Indoor/Outdoor als Chips oder Meta-Zeile.
- Begruendung kurz, maximal wenige Saetze.
- Score kann als kleine Kennzahl oder "Warum gewaehlt" angezeigt werden.

### Budget Cards

- Gesamtbudget, geplante Kosten und Restbudget getrennt anzeigen.
- Budgetstatus farblich markieren.
- Kategorien als kompakte Liste oder Balken.
- Unterkunft und Anreise in MVP 1 nicht anzeigen, ausser als Hinweis "nicht enthalten".

### Checklist Items

- Checkbox links.
- Label klar lesbar.
- Kategorie als kleiner Chip.
- Completed Items dezent abblenden, aber lesbar lassen.

### Agent Insight Rows

- Agentname links.
- Statuschip rechts oder neben dem Namen.
- Kurze Aktion darunter oder daneben.
- Beispiele:
  - Coordinator Agent: Anfrage analysiert
  - Planning Agent: Tagesstruktur erstellt
  - Recommendation Agent: Aktivitaeten bewertet
  - Budget Agent: Budget geprueft

Das Panel ist read-only und soll Transparenz schaffen, keine Debug-Konsole sein.

### Replanning Proposal Cards

- Pending Proposal mit gelb/orange Akzent.
- Entfernte Aktivitaeten rot markieren.
- Neue Aktivitaeten gruen markieren.
- Verschobene Aktivitaeten blau markieren.
- Budget-Differenz sichtbar machen.
- Primaere Aktion: "Aenderungen uebernehmen".
- Sekundaere Aktion: "Ablehnen".

## UX-Zustaende

| Zustand | Darstellung |
| --- | --- |
| idle | Leerer Dashboard-Zustand mit Demo-Button als klare erste Aktion |
| loading | dezente Skeletons oder Spinner in betroffenen Panels |
| planning | Agent Insights zeigen laufende Schritte; Eingaben temporaer deaktivieren |
| replanning | Proposal-Bereich zeigt Fortschritt; aktiver Plan bleibt sichtbar |
| proposal_pending | ReplanningProposalPanel sichtbar und hervorgehoben |
| success | kurze Bestaetigung, aktualisierte Daten im Dashboard |
| error | klare Fehlermeldung, bestehender Plan bleibt erhalten |
| empty state | freundlicher Hinweis, welche Aktion als Naechstes sinnvoll ist |

## Responsiveness

### Desktop-first

Desktop ist die primaere Demo-Zielgroesse.

Empfohlene Prioritaet:

1. Header oben
2. DayPlanPanel zentral und breit
3. ChatPanel links
4. BudgetPanel rechts oben
5. RouteMapPanel, ChecklistPanel und AgentInsightsPanel darunter
6. ReplanningProposalPanel als breiter Bereich unter dem Grid oder als gut sichtbarer Seitenbereich

### Mobile

Mobile Anpassung fuer MVP 1:

- Panels stapeln sich vertikal.
- DayPlanPanel zuerst nach Header und Demo-Aktionen.
- ChatPanel kann darunter erscheinen.
- AgentInsightsPanel bleibt kompakt.
- ReplanningProposalPanel erscheint direkt unter dem aktiven Tagesplan.

Keine komplexen mobilen Gesten oder App-Navigation fuer MVP 1.

## MVP-1-Vereinfachungen

- Keine komplexe Animation.
- Keine echte Karte.
- Keine vollstaendige Design-Library noetig.
- Keine Auth-UI.
- Keine dunkle Theme-Variante erforderlich.
- Keine vollstaendige Accessibility-Zertifizierung, aber solide Basics: Kontrast, Fokuszustand, Tastaturbedienbarkeit fuer Buttons und Inputs.

## Design-Do-Not

- Keine dekorativen Orbs oder rein atmosphaerischen Flaechen.
- Keine ueberladenen Schatten.
- Keine vollflaechige Chatbot-UI.
- Keine versteckten kritischen Aenderungen.
- Keine automatische Uebernahme von Replanning-Vorschlaegen.

