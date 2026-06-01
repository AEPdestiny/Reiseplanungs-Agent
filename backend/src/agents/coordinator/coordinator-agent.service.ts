import { Injectable } from "@nestjs/common";
import { AGENT_NAMES, type AgentInsight, type Trip } from "@travel-agent/shared";
import { OpenAiService } from "../../modules/openai/openai.service";

export interface CoordinatorChatResult {
  message: string;
  requiresUserConfirmation: boolean;
  agentInsights: AgentInsight[];
}

@Injectable()
export class CoordinatorAgentService {
  constructor(private readonly openAiService: OpenAiService) {}

  async handleChatMessage(trip: Trip, message: string): Promise<CoordinatorChatResult> {
    const requiresProposalNotice = this.detectChangeIntent(message);
    const openAiResponse = await this.openAiService.generateAssistantMessage({
      userMessage: message,
      tripSummary: this.createTripSummary(trip),
      requiresProposalNotice
    });

    return {
      message: openAiResponse.message,
      requiresUserConfirmation: false,
      agentInsights: this.createChatInsights(openAiResponse.usedFallback)
    };
  }

  private detectChangeIntent(message: string): boolean {
    const normalized = message
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const changeSignals = [
      "aender",
      "tausch",
      "ersetz",
      "verschieb",
      "anderes",
      "alternative",
      "neu planen",
      "umplan"
    ];

    return changeSignals.some((signal) => normalized.includes(signal));
  }

  private createTripSummary(trip: Trip): string {
    const request = trip.request;
    const plan = trip.activePlan;
    const daySummaries =
      plan?.days.map((day) => {
        const activityNames = day.timeSlots.map((slot) => slot.activity.name).join(", ");
        return `Tag ${day.dayNumber}: ${activityNames}`;
      }) ?? [];

    return [
      `Ziel: ${request.destination}`,
      `Dauer: ${request.durationDays} Tage`,
      `Budget: ${request.budgetTotal} ${request.currency}`,
      `Personen: ${request.numberOfPeople}`,
      `Interessen: ${request.interests.join(", ")}`,
      `Budgetstatus: ${plan?.budgetSummary.status ?? "unbekannt"}`,
      ...daySummaries
    ].join("\n");
  }

  private createChatInsights(usedFallback: boolean): AgentInsight[] {
    return [
      {
        agentName: AGENT_NAMES.coordinator,
        displayLabel: "Coordinator Agent",
        status: "completed",
        summary: "Nachricht analysiert"
      },
      {
        agentName: "OpenAI Service",
        displayLabel: "OpenAI Service",
        status: "completed",
        summary: usedFallback ? "Fallback-Antwort verwendet" : "Antwort generiert"
      },
      {
        agentName: AGENT_NAMES.coordinator,
        displayLabel: "Coordinator Agent",
        status: "completed",
        summary: "Antwort zusammengefuehrt"
      }
    ];
  }
}
