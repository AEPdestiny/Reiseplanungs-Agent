import { Injectable } from "@nestjs/common";
import type { TripRequest } from "@travel-agent/shared";
import { OpenAiService } from "../../modules/openai/openai.service";
import type { OpenAiPlanningAttempt } from "./planning.types";

@Injectable()
export class OpenAiPlanningService {
  constructor(private readonly openAiService: OpenAiService) {}

  async createStructuredPlanProposal(request: TripRequest): Promise<OpenAiPlanningAttempt> {
    const result = await this.openAiService.generateStructuredTravelPlan(this.buildStructuredPlanningPrompt(request));

    return {
      rawText: result.rawText,
      usedFallback: result.usedFallback,
      fallbackReason: result.fallbackReason
    };
  }

  private buildStructuredPlanningPrompt(request: TripRequest): string {
    return [
      "Du bist ein Reiseplanungs-Agent fuer ein strukturiertes Reise-Dashboard.",
      "Antworte ausschliesslich auf Deutsch.",
      "Gib ausschliesslich valides JSON zurueck. Kein Markdown, keine Erklaerung ausserhalb des JSON.",
      "Erzeuge keinen finalen BudgetSummary-Wert und fuehre keine Buchungen aus.",
      "Stelle Preise nie als garantiert dar. Kosten sind nur grobe Planungsschaetzungen.",
      "Plane passend zu Interessen, Budgetrahmen, Personenanzahl und Reisetyp.",
      "",
      "Die JSON-Struktur muss exakt so aussehen:",
      "{",
      '  "days": [',
      "    {",
      '      "dayNumber": 1,',
      '      "title": "Kurzer deutscher Tagestitel",',
      '      "timeSlots": [',
      "        {",
      '          "startTime": "10:00",',
      '          "endTime": "11:30",',
      '          "activity": {',
      '            "name": "Name",',
      '            "category": "museum | restaurant | sightseeing | walk | activity | transport | break",',
      '            "description": "Beschreibung",',
      '            "location": { "name": "Ort", "area": "Stadtteil oder Gegend" },',
      '            "estimatedCostPerPerson": 18,',
      '            "durationMinutes": 90,',
      '            "indoorOutdoor": "indoor | outdoor | mixed",',
      '            "tags": ["tag1", "tag2"],',
      '            "reasoning": "Kurze nachvollziehbare Begruendung"',
      "          }",
      "        }",
      "      ]",
      "    }",
      "  ]",
      "}",
      "",
      `Ziel: ${request.destination}`,
      `Dauer: ${request.durationDays} Tage. Liefere exakt ${request.durationDays} Tage.`,
      `Budgetrahmen: ${request.budgetTotal} ${request.currency} fuer ${request.numberOfPeople} Person(en).`,
      `Reisetyp: ${request.travelType}`,
      `Interessen: ${request.interests.join(", ")}`,
      request.startDate ? `Startdatum: ${request.startDate}` : "Startdatum: nicht angegeben",
      request.endDate ? `Enddatum: ${request.endDate}` : "Enddatum: nicht angegeben",
      "",
      "Regeln:",
      "- Jeder Tag braucht mehrere TimeSlots.",
      "- Jede Aktivitaet braucht name, category, description, location.name, estimatedCostPerPerson, durationMinutes, indoorOutdoor, tags und reasoning.",
      "- Verwende nur erlaubte Kategorien und indoorOutdoor-Werte aus dem Schema.",
      "- estimatedCostPerPerson darf nicht negativ sein.",
      "- durationMinutes muss positiv sein.",
      "- Keine echten Buchungen, keine garantierten Preise, keine finalen BudgetSummaries."
    ].join("\n");
  }
}
