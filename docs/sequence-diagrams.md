# Sequence Diagrams

## 1. Initiale Reiseplanung

```mermaid
sequenceDiagram
  participant User
  participant UI as Vue Dashboard
  participant API as NestJS API
  participant Coord as Coordinator Agent
  participant Plan as Planning Agent
  participant Rec as Recommendation Agent
  participant Budget as Budget Agent
  participant Check as Checklist Agent
  participant OpenAI as OpenAI Responses API
  participant Mock as Mock Data Providers

  User->>UI: Reise eingeben oder "Demo-Reise laden"
  UI->>API: POST /api/trips/plan oder /api/trips/demo
  API->>Coord: Planungsworkflow starten
  Coord->>Mock: Berlin Mock-Daten laden
  Coord->>OpenAI: Strukturierte Planung mit gpt-5 anfordern
  Coord->>Plan: Tagesstruktur erstellen
  Coord->>Rec: Aktivitaeten bewerten
  Rec-->>Coord: Empfehlungen mit Activity Scores
  Coord->>Budget: Budget deterministisch berechnen
  Budget-->>Coord: BudgetSummary
  Coord->>Check: Checkliste erstellen
  Check-->>Coord: Checklist
  Coord-->>API: Plan, Budget, Checklist, Agent Trace
  API-->>UI: Strukturierte Response
  UI-->>User: Dashboard mit Agent Insights anzeigen
```

## 2. Wetteraenderung simulieren

```mermaid
sequenceDiagram
  participant User
  participant UI as Vue Dashboard
  participant API as NestJS API
  participant Weather as MockWeatherProvider
  participant Coord as Coordinator Agent

  User->>UI: "Regen an Tag 2 simulieren"
  UI->>API: POST /api/trips/:tripId/simulate-weather
  API->>Weather: simulateWeatherEvent(Tag 2, rain)
  Weather-->>API: WeatherEvent
  API->>Coord: Replanning pruefen
  Note over API,Coord: Aktiver Reiseplan bleibt unveraendert
```

## 3. Neuplanungsvorschlag erstellen

```mermaid
sequenceDiagram
  participant API as NestJS API
  participant Coord as Coordinator Agent
  participant Replan as Replanning Agent
  participant Rec as Recommendation Agent
  participant Plan as Planning Agent
  participant Budget as Budget Agent
  participant Proposal as Proposal Service
  participant UI as Vue Dashboard

  API->>Coord: WeatherEvent + aktiver Plan
  Coord->>Replan: Betroffene Aktivitaeten finden
  Replan-->>Coord: Outdoor-Aktivitaeten an Tag 2
  Coord->>Rec: Indoor-Alternativen bewerten
  Rec-->>Coord: Alternativen mit Activity Scores
  Coord->>Plan: Tag 2 neu sortieren
  Plan-->>Coord: ProposedPlan
  Coord->>Budget: Budget neu berechnen
  Budget-->>Coord: BudgetAfter
  Coord->>Proposal: Pending Proposal speichern
  Proposal-->>Coord: ReplanningProposal status=pending
  Coord-->>API: Vorschlag requiresUserConfirmation=true
  API-->>UI: Proposal anzeigen
  Note over UI: Aktiver Plan wird noch nicht ueberschrieben
```

## 4. Neuplanung uebernehmen

```mermaid
sequenceDiagram
  participant User
  participant UI as Vue Dashboard
  participant API as NestJS API
  participant Proposal as Proposal Service

  User->>UI: "Aenderungen uebernehmen"
  UI->>API: POST /api/trips/:tripId/proposals/:proposalId/accept
  API->>Proposal: Proposal validieren
  Proposal->>Proposal: proposedPlan als aktiven Plan setzen
  Proposal-->>API: Aktualisierter TravelPlan
  API-->>UI: Plan status=active
  UI-->>User: Aktualisierten Tagesplan anzeigen
```

## 5. Neuplanung ablehnen

```mermaid
sequenceDiagram
  participant User
  participant UI as Vue Dashboard
  participant API as NestJS API
  participant Proposal as Proposal Service

  User->>UI: "Ablehnen"
  UI->>API: POST /api/trips/:tripId/proposals/:proposalId/reject
  API->>Proposal: Proposal status=rejected setzen
  Proposal-->>API: Aktiver Plan unveraendert
  API-->>UI: Originalplan + rejected Proposal
  UI-->>User: Originalplan bleibt sichtbar
```

## 6. Checkliste aktualisieren

```mermaid
sequenceDiagram
  participant User
  participant UI as ChecklistPanel
  participant API as NestJS API
  participant Travel as TravelService

  User->>UI: Checklistenpunkt abhaken
  UI->>API: PATCH /api/trips/:tripId/checklist/items/:itemId
  API->>Travel: ChecklistItem aktualisieren
  Travel-->>API: Aktualisierte Checklist
  API-->>UI: Checklist Response
  UI-->>User: Status aktualisieren
```
