# Implementierungsplan

## 1. Projektsetup

| Feld | Inhalt |
| --- | --- |
| Ziel | Frontend- und Backend-Grundstruktur erstellen. |
| Aufgaben | Vue 3 mit TypeScript, Pinia und Router einrichten; NestJS Backend einrichten; Startskripte definieren; README aktualisieren. |
| Akzeptanzkriterien | Frontend und Backend starten lokal; leere Dashboard-Route erreichbar; API Health Check erreichbar. |
| Risiken | Monorepo-Struktur kann spaetere Shared Types erschweren, wenn sie nicht sauber geplant wird. |
| Komplexitaet | mittel |

## 2. Shared Types

| Feld | Inhalt |
| --- | --- |
| Ziel | Einheitliche Typen fuer Trip, Plan, Budget, Proposal, Activity Score und Agent Trace. |
| Aufgaben | Datenmodelle aus Spec ableiten; DTOs definieren; Response-Formate abstimmen. |
| Akzeptanzkriterien | Frontend und Backend verwenden konsistente Strukturen; API-Responses passen zu `docs/api-contracts.md`. |
| Risiken | Zu fruehe Uebermodellierung kann MVP 1 bremsen. |
| Komplexitaet | mittel |

## 3. Backend Mock Data

| Feld | Inhalt |
| --- | --- |
| Ziel | Stabile Berlin-Demo-Daten bereitstellen. |
| Aufgaben | Aktivitaeten, Restaurants, Museen, Spaziergaenge, Locations und Kostenannahmen anlegen; MockWeatherProvider vorbereiten. |
| Akzeptanzkriterien | Demo-Reise kann vollstaendig aus Mock-Daten geplant werden; Tag 2 hat Indoor-Alternativen. |
| Risiken | Zu wenige oder schlechte Mock-Daten machen die Demo unglaubwuerdig. |
| Komplexitaet | mittel |

## 4. BudgetService

| Feld | Inhalt |
| --- | --- |
| Ziel | Deterministische Budgetberechnung fuer MVP-1-Scope. |
| Aufgaben | Kosten pro Person und Gesamt berechnen; Kategorien aggregieren; Status `within_budget`, `near_limit`, `over_budget` setzen. |
| Akzeptanzkriterien | Budget fuer 2 Personen korrekt; Unterkunft und Anreise werden nicht eingerechnet. |
| Risiken | LLM-generierte Summen duerfen nicht ungeprueft uebernommen werden. |
| Komplexitaet | niedrig |

## 5. Agenten-Grundstruktur

| Feld | Inhalt |
| --- | --- |
| Ziel | Eigene NestJS-Agenten-Orchestrierung ohne LangChain/LangGraph. |
| Aufgaben | Coordinator, Planning, Recommendation, Budget, Replanning und Checklist Agent als Services schneiden; AgentContext und AgentResult definieren. |
| Akzeptanzkriterien | Coordinator kann Spezialagenten aufrufen und Agent Trace erzeugen. |
| Risiken | Zu viel generische Agentenabstraktion kann MVP 1 unnoetig komplex machen. |
| Komplexitaet | hoch |

## 6. OpenAI Integration

| Feld | Inhalt |
| --- | --- |
| Ziel | OpenAI Responses API mit `gpt-5` anbinden. |
| Aufgaben | OpenAiModule erstellen; strukturierte Outputs definieren; Timeouts und Validierung vorbereiten; Fallbacks konzipieren. |
| Akzeptanzkriterien | Backend kann strukturierte LLM-Antworten anfordern und validieren. |
| Risiken | Latenz, Kosten und nicht valide Outputs. |
| Komplexitaet | mittel |

## 7. Initiale Reiseplanung

| Feld | Inhalt |
| --- | --- |
| Ziel | `POST /api/trips/demo` und `POST /api/trips/plan` liefern einen kompletten Plan. |
| Aufgaben | Demo-Endpoint bauen; Planungsworkflow verbinden; Activity Scoring nutzen; Budget und Checkliste erzeugen. |
| Akzeptanzkriterien | Berlin-Demo erzeugt 3 Tage, Budget, Checkliste und Agent Insights. |
| Risiken | Plan kann unstimmig wirken, wenn Mock-Daten und LLM-Begruendungen nicht harmonieren. |
| Komplexitaet | hoch |

## 8. Frontend Dashboard

| Feld | Inhalt |
| --- | --- |
| Ziel | Dashboard-zentrierte UI fuer alle MVP-1-Bereiche. |
| Aufgaben | Layout und Panels bauen; Pinia Stores erstellen; Demo-Button anbinden; Lade- und Fehlerzustaende umsetzen. |
| Akzeptanzkriterien | Chat, Tagesplan, Budget, Route, Checkliste und Agent Insights sind sichtbar. |
| Risiken | UI kann ueberladen wirken, wenn Panels nicht klar priorisiert sind. |
| Komplexitaet | mittel |

## 9. Replanning Flow

| Feld | Inhalt |
| --- | --- |
| Ziel | Regen an Tag 2 erzeugt pending Vorschlag ohne direkten Plan-Overwrite. |
| Aufgaben | Weather Simulation Endpoint; Replanning Agent; ProposalService; Accept/Reject APIs; Frontend Proposal Panel. |
| Akzeptanzkriterien | Aktiver Plan bleibt bis zur Bestaetigung unveraendert; Budget wird neu berechnet; Ablehnung behaelt Originalplan. |
| Risiken | Vergleich zwischen Original und Vorschlag kann unklar werden. |
| Komplexitaet | hoch |

## 10. Agent Insights

| Feld | Inhalt |
| --- | --- |
| Ziel | Agentenarbeit in der UI sichtbar machen. |
| Aufgaben | AgentTraceEntry und AgentInsight erzeugen; Store anbinden; Panel darstellen; Status `running`, `completed`, `failed` abbilden. |
| Akzeptanzkriterien | Demo zeigt nachvollziehbar, welche Agenten gearbeitet haben. |
| Risiken | Zu technische Details koennen Nutzer ablenken. |
| Komplexitaet | niedrig |

## 11. Demo-Haertung

| Feld | Inhalt |
| --- | --- |
| Ziel | Stabile und wiederholbare Demo. |
| Aufgaben | Happy Path testen; Fehlerfaelle pruefen; Copy-Texte schaerfen; README mit Demo-Anleitung ergaenzen. |
| Akzeptanzkriterien | Demo-Reise laden, Regen simulieren, Vorschlag annehmen/ablehnen und Checkliste aktualisieren funktionieren stabil. |
| Risiken | Kleine Inkonsistenzen in Mock-Daten koennen die Erzaehlung stoeren. |
| Komplexitaet | mittel |
