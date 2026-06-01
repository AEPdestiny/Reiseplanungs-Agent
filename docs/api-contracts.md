# API Contracts MVP 1

## Gemeinsame Regeln

- Basis-Pfad: `/api`
- Content-Type: `application/json`
- Fehlerantworten verwenden ein einheitliches Format.
- Budgetwerte sind in EUR.
- Kritische Planaenderungen werden als `ReplanningProposal` mit `status=pending` geliefert und nicht automatisch angewendet.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Die Anfrage ist ungueltig.",
    "details": []
  }
}
```

## POST /api/trips/demo

### Zweck

Laedt die feste Berlin-Demo-Reise fuer MVP 1.

### Request Body

Kein Body erforderlich.

### Response Body

```json
{
  "tripId": "trip_demo_berlin",
  "message": "Die Demo-Reise fuer Berlin wurde geladen.",
  "plan": {},
  "budget": {},
  "checklist": {},
  "agentTrace": [],
  "agentInsights": []
}
```

### Fehlerfaelle

| Code | Bedeutung |
| --- | --- |
| `DEMO_DATA_NOT_FOUND` | Demo-Mock-Daten fehlen. |
| `PLANNING_FAILED` | Plan konnte nicht erstellt werden. |

### Beispiel

```json
{
  "tripId": "trip_demo_berlin",
  "message": "Die Demo-Reise fuer Berlin wurde geladen."
}
```

## POST /api/trips/plan

### Zweck

Erstellt einen Reiseplan aus Nutzereingaben.

### Request Body

```json
{
  "destination": "Berlin",
  "durationDays": 3,
  "budgetTotal": 600,
  "currency": "EUR",
  "numberOfPeople": 2,
  "travelType": "couple",
  "interests": ["Museen", "gutes Essen", "Sehenswuerdigkeiten", "Spaziergaenge"]
}
```

### Response Body

```json
{
  "tripId": "trip_123",
  "message": "Ich habe einen 3-Tage-Plan fuer Berlin erstellt.",
  "plan": {},
  "budget": {},
  "checklist": {},
  "agentTrace": [],
  "agentInsights": []
}
```

### Fehlerfaelle

| Code | Bedeutung |
| --- | --- |
| `VALIDATION_ERROR` | Pflichtfelder fehlen oder sind ungueltig. |
| `UNSUPPORTED_DESTINATION` | Fuer das Ziel fehlen MVP-1-Mock-Daten. |
| `OPENAI_TIMEOUT` | OpenAI-Aufruf hat Timeout erreicht. |
| `PLANNING_FAILED` | Kein valider Plan erzeugbar. |

## GET /api/trips/:tripId

### Zweck

Liefert den aktuellen Trip-Zustand.

### Request Body

Kein Body.

### Response Body

```json
{
  "tripId": "trip_123",
  "plan": {},
  "budget": {},
  "checklist": {},
  "pendingProposal": null,
  "agentInsights": []
}
```

### Fehlerfaelle

| Code | Bedeutung |
| --- | --- |
| `TRIP_NOT_FOUND` | Trip existiert nicht. |

## POST /api/trips/:tripId/chat

### Zweck

Sendet eine Chat-Nachricht an den Coordinator Agent.

### Request Body

```json
{
  "message": "Kannst du fuer Tag 1 ein guenstigeres Restaurant vorschlagen?"
}
```

### Response Body

```json
{
  "message": "Ich habe eine guenstigere Alternative gefunden.",
  "plan": {},
  "proposal": {},
  "requiresUserConfirmation": true,
  "agentInsights": []
}
```

### Fehlerfaelle

| Code | Bedeutung |
| --- | --- |
| `TRIP_NOT_FOUND` | Trip existiert nicht. |
| `CHAT_MESSAGE_EMPTY` | Nachricht ist leer. |
| `AGENT_FAILED` | Coordinator konnte die Anfrage nicht verarbeiten. |

## POST /api/trips/:tripId/simulate-weather

### Zweck

Simuliert ein Wetterereignis und erzeugt bei Bedarf einen Neuplanungsvorschlag.

### Request Body

```json
{
  "dayNumber": 2,
  "condition": "rain",
  "severity": "medium",
  "description": "Am zweiten Tag ist Regen vorhergesagt."
}
```

### Response Body

```json
{
  "message": "Fuer Tag 2 schlage ich wetterfeste Alternativen vor.",
  "proposal": {
    "id": "proposal_123",
    "status": "pending"
  },
  "requiresUserConfirmation": true,
  "agentInsights": []
}
```

### Fehlerfaelle

| Code | Bedeutung |
| --- | --- |
| `TRIP_NOT_FOUND` | Trip existiert nicht. |
| `INVALID_DAY` | Tag liegt ausserhalb der Reise. |
| `NO_ACTIVE_PLAN` | Es gibt keinen aktiven Plan. |
| `REPLANNING_FAILED` | Kein valider Vorschlag erzeugbar. |

## POST /api/trips/:tripId/proposals/:proposalId/accept

### Zweck

Uebernimmt einen pending Neuplanungsvorschlag.

### Request Body

Kein Body.

### Response Body

```json
{
  "message": "Die Aenderungen wurden uebernommen.",
  "plan": {},
  "budget": {},
  "proposal": {
    "id": "proposal_123",
    "status": "accepted"
  },
  "agentInsights": []
}
```

### Fehlerfaelle

| Code | Bedeutung |
| --- | --- |
| `TRIP_NOT_FOUND` | Trip existiert nicht. |
| `PROPOSAL_NOT_FOUND` | Vorschlag existiert nicht. |
| `PROPOSAL_NOT_PENDING` | Vorschlag wurde bereits bearbeitet. |

## POST /api/trips/:tripId/proposals/:proposalId/reject

### Zweck

Lehnt einen pending Neuplanungsvorschlag ab und laesst den aktiven Plan unveraendert.

### Request Body

Kein Body.

### Response Body

```json
{
  "message": "Der Vorschlag wurde abgelehnt. Der aktuelle Plan bleibt unveraendert.",
  "plan": {},
  "proposal": {
    "id": "proposal_123",
    "status": "rejected"
  },
  "agentInsights": []
}
```

### Fehlerfaelle

| Code | Bedeutung |
| --- | --- |
| `TRIP_NOT_FOUND` | Trip existiert nicht. |
| `PROPOSAL_NOT_FOUND` | Vorschlag existiert nicht. |
| `PROPOSAL_NOT_PENDING` | Vorschlag wurde bereits bearbeitet. |

## PATCH /api/trips/:tripId/checklist/items/:itemId

### Zweck

Aktualisiert einen Checklistenpunkt.

### Request Body

```json
{
  "completed": true
}
```

### Response Body

```json
{
  "checklist": {
    "id": "checklist_123",
    "items": []
  }
}
```

### Fehlerfaelle

| Code | Bedeutung |
| --- | --- |
| `TRIP_NOT_FOUND` | Trip existiert nicht. |
| `CHECKLIST_ITEM_NOT_FOUND` | Checklistenpunkt existiert nicht. |
| `VALIDATION_ERROR` | Body ist ungueltig. |
