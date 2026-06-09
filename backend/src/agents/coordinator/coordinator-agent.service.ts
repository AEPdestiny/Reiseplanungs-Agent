import { Injectable } from "@nestjs/common";
import { AGENT_NAMES, type AgentInsight, type Trip } from "@travel-agent/shared";
import { GeminiChatService } from "./gemini-chat.service";
import { RuleBasedTripChatService } from "./rule-based-trip-chat.service";

export interface CoordinatorChatResult {
  message: string;
  requiresUserConfirmation: boolean;
  agentInsights: AgentInsight[];
}

@Injectable()
export class CoordinatorAgentService {
  constructor(
    private readonly geminiChatService: GeminiChatService,
    private readonly ruleBasedTripChatService: RuleBasedTripChatService
  ) {}

  async handleChatMessage(trip: Trip, message: string): Promise<CoordinatorChatResult> {
    const requiresProposalNotice = this.detectChangeIntent(message);
    const ruleBasedResponse = this.ruleBasedTripChatService.createResponse(trip, message);
    const geminiResponse = await this.geminiChatService.generateTripAnswer({
      userMessage: message,
      tripSummary: this.createTripSummary(trip)
    });
    const baseMessage = geminiResponse ?? ruleBasedResponse.message;
    const proposalNotice = requiresProposalNotice
      ? " Aenderungen werden nicht automatisch uebernommen. Dafuer nutzt die App einen Proposal-Flow mit Nutzerbestaetigung."
      : "";

    return {
      message: `${baseMessage}${proposalNotice}`,
      requiresUserConfirmation: false,
      agentInsights: this.createChatInsights(Boolean(geminiResponse), ruleBasedResponse.intent)
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

  private createChatInsights(usedGemini: boolean, intent: string): AgentInsight[] {
    return [
      {
        agentName: AGENT_NAMES.coordinator,
        displayLabel: "Coordinator Agent",
        status: "completed",
        summary: "Nachricht analysiert"
      },
      {
        agentName: usedGemini ? "GeminiChatService" : "RuleBasedTripChatService",
        displayLabel: usedGemini ? "Gemini Chat" : "Rule-based Chat",
        status: "completed",
        summary: usedGemini ? "Optionale Gemini-Antwort verwendet" : `Kostenlose regelbasierte Antwort verwendet (${intent})`
      },
      this.ruleBasedTripChatService.createInsight(intent),
      {
        agentName: AGENT_NAMES.coordinator,
        displayLabel: "Coordinator Agent",
        status: "completed",
        summary: "Antwort zusammengefuehrt"
      }
    ];
  }
}
