# Projektstruktur

## Monorepo-Entscheidung

Das Projekt wird verbindlich als Monorepo aufgebaut.

```text
travel-agent/
|-- frontend/
|-- backend/
|-- shared/
`-- docs/
```

Begruendung:

- Frontend, Backend und Shared Types koennen gemeinsam versioniert werden.
- API-Vertraege und Domain-Typen bleiben leichter konsistent.
- MVP 1 kann schnell iteriert werden, ohne mehrere Repositories zu koordinieren.
- Spaetere Erweiterungen fuer PostgreSQL, externe APIs und Exporte behalten klare Modulgrenzen.

## Empfehlung: npm workspaces

npm workspaces werden empfohlen.

Empfohlene Workspaces:

```json
{
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ]
}
```

Warum sinnvoll:

- gemeinsame Installation und Skriptsteuerung
- `shared/` kann als internes Package verwendet werden
- einheitliche TypeScript-, Lint- und Formatierungsregeln moeglich
- weniger manueller Pfad- und Dependency-Aufwand

Nicht notwendig fuer MVP 1, aber empfehlenswert von Beginn an, weil die Architektur bereits Shared Types vorsieht.

## Root-Struktur

```text
travel-agent/
|-- package.json
|-- README.md
|-- spec_travel_agent.md
|-- frontend/
|-- backend/
|-- shared/
`-- docs/
```

| Pfad | Zweck | Inhalt | Was gehoert nicht hinein |
| --- | --- | --- | --- |
| `package.json` | Monorepo-Steuerung | Workspaces, gemeinsame Skripte | Fachlogik |
| `README.md` | Einstieg | Setup, Demo-Anleitung, Startbefehle | Tiefe Architekturdetails |
| `spec_travel_agent.md` | Hauptspezifikation | Produkt-, Architektur- und MVP-Regeln | Implementierungsdetails einzelner Dateien |
| `frontend/` | Vue-App | UI, Stores, Routing, API-Clients | Backend-Orchestrierung |
| `backend/` | NestJS-App | API, Agenten, Services, Provider | Vue-Komponenten |
| `shared/` | Gemeinsame Typen | Contracts, Types, Konstanten | Laufzeitlogik mit Framework-Abhaengigkeit |
| `docs/` | Planungsdokumente | Architektur, API, Wireframes, Domain Model | Produktivcode |

## Frontend-Struktur

Frontend basiert auf Vue 3, TypeScript, Pinia und Vue Router.

```text
frontend/
|-- package.json
|-- index.html
|-- vite.config.ts
|-- tsconfig.json
`-- src/
    |-- assets/
    |-- components/
    |   |-- dashboard/
    |   |-- chat/
    |   |-- trip/
    |   |-- budget/
    |   |-- checklist/
    |   |-- agent-insights/
    |   `-- replanning/
    |-- views/
    |-- stores/
    |-- services/
    |-- router/
    |-- types/
    |-- App.vue
    `-- main.ts
```

### Frontend-Ordner

| Ordner | Zweck | Inhalt | Was gehoert nicht hinein |
| --- | --- | --- | --- |
| `src/assets/` | Statische UI-Assets | Icons, Bilder, globale Medien | Businesslogik |
| `src/components/dashboard/` | Layout-Komponenten | `DashboardLayout`, Header, Grid-Struktur | API-Services |
| `src/components/chat/` | Chat-UI | `ChatPanel`, Chat-Bubbles, Eingabe | Agentenlogik |
| `src/components/trip/` | Reiseplan-UI | `DayPlanPanel`, Day Tabs, TimeSlot Items | Budgetberechnungen |
| `src/components/budget/` | Budget-UI | `BudgetPanel`, Kategorieanzeigen, Statuschips | Backend-Datenzugriff |
| `src/components/checklist/` | Checklisten-UI | `ChecklistPanel`, `ChecklistItemRow` | Persistenzlogik |
| `src/components/agent-insights/` | Agenten-Transparenz | `AgentInsightsPanel`, Insight Rows | Technischer Full Trace |
| `src/components/replanning/` | Vorschlags-UI | `ReplanningProposalPanel`, Change Cards | direkte Planmutation ohne API |
| `src/views/` | Routenansichten | `TravelDashboardView`, `NotFoundView` | Wiederverwendbare Mini-Komponenten |
| `src/stores/` | Pinia Stores | `tripStore`, `chatStore`, `budgetStore`, `proposalStore`, `checklistStore`, `agentInsightsStore` | HTTP-Details, wenn sie besser in Services liegen |
| `src/services/` | API-Clients | Travel API Client, Fehlernormalisierung | UI-Rendering |
| `src/router/` | Vue Router | Routen fuer Dashboard und NotFound | Komponentenlogik |
| `src/types/` | Frontend-spezifische Typen | UI States, View Models | Shared Domain Types, wenn sie allgemein sind |

## Backend-Struktur

Backend basiert auf Node.js, NestJS, TypeScript, OpenAI Responses API mit `gpt-5`, eigener Agenten-Orchestrierung und Mock-Daten in MVP 1.

```text
backend/
|-- package.json
|-- nest-cli.json
|-- tsconfig.json
`-- src/
    |-- app.module.ts
    |-- main.ts
    |-- modules/
    |   |-- travel/
    |   |-- agent/
    |   |-- openai/
    |   |-- mock-data/
    |   |-- weather/
    |   |-- budget/
    |   `-- proposal/
    |-- agents/
    |   |-- coordinator/
    |   |-- planning/
    |   |-- recommendation/
    |   |-- budget/
    |   |-- replanning/
    |   `-- checklist/
    |-- providers/
    |   |-- weather/
    |   `-- places/
    |-- dto/
    |-- models/
    |-- common/
    `-- config/
```

### Backend-Ordner

| Ordner | Zweck | Inhalt | Was gehoert nicht hinein |
| --- | --- | --- | --- |
| `src/modules/travel/` | Trip API | Controller, Service, Trip-Facade | Spezialagenten-Implementierung |
| `src/modules/agent/` | Agenten-Orchestrierung | `AgentOrchestratorService`, Agent Interfaces | UI-spezifische Datenformate |
| `src/modules/openai/` | OpenAI-Anbindung | `OpenAiService`, Response-Schemas, Modellkonfiguration `gpt-5` | Budgetberechnung |
| `src/modules/mock-data/` | Mock-Datenzugriff | MockDataService, Berlin-Daten Provider | echte API-Adapter |
| `src/modules/weather/` | Wettermodul | WeatherProvider Token, MockWeatherProvider Wiring | Places-Suche |
| `src/modules/budget/` | Budgetlogik | BudgetService, Budgetregeln | LLM-Prompts |
| `src/modules/proposal/` | Vorschlagsverwaltung | ProposalService, Accept/Reject Logik | UI-Vergleichsdarstellung |
| `src/agents/coordinator/` | Coordinator Agent | Routing, Zusammenfuehrung, Confirmation-Entscheidung | konkrete Budgetarithmetik |
| `src/agents/planning/` | Planning Agent | Tagesstruktur, Zeitfenster | Wetterprovider |
| `src/agents/recommendation/` | Recommendation Agent | Empfehlungen, Activity Scoring | Planpersistenz |
| `src/agents/budget/` | Budget Agent | Budgetinterpretation und Hinweise | finale Summen ohne BudgetService |
| `src/agents/replanning/` | Replanning Agent | Wetterreaktion, PlanChange-Vorschlaege | direkte Uebernahme des Plans |
| `src/agents/checklist/` | Checklist Agent | Pack-, Dokumenten- und Vorbereitungsliste | Trip Controller |
| `src/providers/weather/` | Provider-Implementierungen | `MockWeatherProvider`, spaeter `ExternalWeatherProvider` | Agentenworkflow |
| `src/providers/places/` | Spaetere Places-Provider | Interface fuer Google Places | MVP-1-Mock-Daten, wenn sie im MockDataModule liegen |
| `src/dto/` | API DTOs | Request/Response DTOs | Domainlogik |
| `src/models/` | Backend-Modelle | interne Domain-Modelle, Mapper | Vue-Typen |
| `src/common/` | Querschnitt | Error Handling, Validation, Logging Helper | Feature-spezifische Logik |
| `src/config/` | Konfiguration | Environment, OpenAI config, Feature Flags | Secrets im Klartext |

## Shared-Struktur

```text
shared/
|-- package.json
|-- tsconfig.json
`-- src/
    |-- types/
    |-- contracts/
    `-- constants/
```

| Ordner | Zweck | Inhalt | Was gehoert nicht hinein |
| --- | --- | --- | --- |
| `shared/src/types/` | Gemeinsame Domain Types | `Trip`, `TravelPlan`, `Activity`, `BudgetSummary`, `ActivityScore` | NestJS- oder Vue-spezifische Klassen |
| `shared/src/contracts/` | API-Vertraege | Request/Response Shapes fuer Endpunkte | HTTP-Client-Implementierung |
| `shared/src/constants/` | Gemeinsame Konstanten | Budgetstatus, Kategorien, Agentnamen, Demo-Konstanten | Konfiguration mit Secrets |

Regel: `shared/` darf keine Framework-Abhaengigkeit zu Vue oder NestJS haben. Es soll importierbare TypeScript-Typen und Konstanten bereitstellen.

## Docs-Struktur

```text
docs/
|-- architecture.md
|-- sequence-diagrams.md
|-- api-contracts.md
|-- frontend-wireframes.md
|-- implementation-plan.md
|-- domain-model.md
|-- project-structure.md
`-- design-system.md
```

| Datei | Zweck |
| --- | --- |
| `architecture.md` | Gesamtarchitektur, Schichten, Agenten, Provider, Erweiterungspfad |
| `sequence-diagrams.md` | Ablaufdiagramme fuer Planung, Wetter, Proposal, Checklist |
| `api-contracts.md` | Konkrete MVP-1-API-Vertraege |
| `frontend-wireframes.md` | Textuelle UI-Struktur und Komponentenverhalten |
| `implementation-plan.md` | Schrittweiser Plan fuer Code-Generierung |
| `domain-model.md` | Fachliches Datenmodell und Beziehungen |
| `project-structure.md` | Verbindliche Monorepo- und Ordnerstruktur |
| `design-system.md` | MVP-1-Designregeln fuer UI-Implementierung |

Docs enthalten Entscheidungen und Anforderungen. Sie enthalten keinen Produktivcode und keine generierten Build-Artefakte.

