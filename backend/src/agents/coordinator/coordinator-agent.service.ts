import { Injectable } from "@nestjs/common";
import { AGENT_NAMES, type AgentInsight, type Trip } from "@travel-agent/shared";
import type { GeminiChatResult } from "./gemini-chat.service";
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
    const geminiResult = await this.geminiChatService.generateTripAnswer({
      userMessage: message,
      tripSummary: this.createTripSummary(trip)
    });
    const ruleBasedResponse = geminiResult.status === "success" ? null : this.ruleBasedTripChatService.createResponse(trip, message);
    const baseMessage = geminiResult.message ?? ruleBasedResponse?.message ?? "Ich konnte keine Chat-Antwort erzeugen.";
    const proposalNotice = requiresProposalNotice
      ? " Aenderungen werden nicht automatisch uebernommen. Dafuer nutzt die App einen Proposal-Flow mit Nutzerbestaetigung."
      : "";

    return {
      message: `${baseMessage}${proposalNotice}`,
      requiresUserConfirmation: false,
      agentInsights: this.createChatInsights(geminiResult, ruleBasedResponse?.intent)
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
        const activityNames = day.timeSlots
          .map((slot) => `${slot.startTime}-${slot.endTime}: ${slot.activity.name} (${slot.activity.reasoning})`)
          .join("; ");
        const weather = day.weather ? ` Wetter: ${day.weather.description}` : "";
        return `Tag ${day.dayNumber}: ${activityNames}.${weather}`;
      }) ?? [];
    const checklistItems = trip.checklist?.items.map((item) => item.label).join(", ") ?? "";
    const sources = trip.agentInsights.map((insight) => insight.summary).join(" | ");

    return [
      `Ziel: ${request.destination}`,
      `Dauer: ${request.durationDays} Tage`,
      `Budget: ${request.budgetTotal} ${request.currency}`,
      `Personen: ${request.numberOfPeople}`,
      `Interessen: ${request.interests.join(", ")}`,
      `Budgetstatus: ${plan?.budgetSummary.status ?? "unbekannt"}`,
      `Budget geplant: ${plan?.budgetSummary.plannedTotal ?? "unbekannt"} von ${plan?.budgetSummary.budgetTotal ?? request.budgetTotal}`,
      `Checkliste: ${checklistItems}`,
      `Datenquellen/AgentInsights: ${sources}`,
      ...daySummaries
    ].join("\n");
  }

  private createChatInsights(geminiResult: GeminiChatResult, intent?: string): AgentInsight[] {
    const usedGemini = geminiResult.status === "success";
    const insights: AgentInsight[] = [
      {
        agentName: AGENT_NAMES.coordinator,
        displayLabel: "Coordinator Agent",
        status: "completed",
        summary: "Nachricht analysiert"
      },
      {
        agentName: "GeminiChatService",
        displayLabel: "Gemini Chat",
        status: usedGemini ? "completed" : "failed",
        summary: this.createGeminiInsightSummary(geminiResult)
      }
    ];

    if (!usedGemini && intent) {
      insights.push(
        {
          agentName: "RuleBasedTripChatService",
          displayLabel: "Rule-based Chat",
          status: "completed",
          summary: `Kostenlose regelbasierte Antwort verwendet (${intent})`
        },
        this.ruleBasedTripChatService.createInsight(intent)
      );
    }

    insights.push(
      {
        agentName: usedGemini ? "GeminiChatService" : "RuleBasedTripChatService",
        displayLabel: usedGemini ? "Gemini Chat" : "Rule-based Chat",
        status: "completed",
        summary: usedGemini ? "Gemini Chat verwendet" : "Kostenlose regelbasierte Antwort verwendet"
      },
      {
        agentName: AGENT_NAMES.coordinator,
        displayLabel: "Coordinator Agent",
        status: "completed",
        summary: "Antwort zusammengefuehrt"
      }
    );

    return insights;
  }

  private createGeminiInsightSummary(result: GeminiChatResult): string {
    if (result.status === "success") {
      return "Gemini Chat erfolgreich verwendet";
    }

    if (result.status === "disabled") {
      return "Gemini Chat deaktiviert";
    }

    if (result.status === "missing_key") {
      return "Gemini Chat aktiviert, aber GEMINI_API_KEY fehlt";
    }

    if (result.status === "quota_reached") {
      return "Gemini Chat Fallback: daily_quota_reached";
    }

    return result.detail ? `Gemini Chat Fallback: ${result.status} (${result.detail})` : `Gemini Chat Fallback: ${result.status}`;
  }
}
