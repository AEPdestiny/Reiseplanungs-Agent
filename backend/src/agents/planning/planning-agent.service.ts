import { Injectable } from "@nestjs/common";
import {
  AGENT_NAMES,
  type AgentInsight,
  type AgentInsightStatus,
  type AgentTraceEntry,
  type Checklist,
  type TravelDay,
  type TripRequest
} from "@travel-agent/shared";
import { WeatherService } from "../../modules/weather/weather.service";
import { OpenAiPlanningService } from "./openai-planning.service";
import { StructuredPlanNormalizer } from "./structured-plan-normalizer";
import { TripPlanFactory } from "./trip-plan.factory";

export interface PlanningContext {
  tripId: string;
  timestamp: string;
}

export interface PlanningResult {
  days: TravelDay[];
  checklist: Checklist;
  agentTrace: AgentTraceEntry[];
  agentInsights: AgentInsight[];
  messageParts: string[];
  warnings: string[];
  usedDestinationFallback: boolean;
  usedOpenAiPlanning: boolean;
}

@Injectable()
export class PlanningAgentService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly openAiPlanningService: OpenAiPlanningService,
    private readonly structuredPlanNormalizer: StructuredPlanNormalizer,
    private readonly tripPlanFactory: TripPlanFactory
  ) {}

  async createInitialPlanFromRequest(request: TripRequest, context: PlanningContext): Promise<PlanningResult> {
    const weather = await this.weatherService.getWeatherForTrip(request);
    const weatherSourceSummary = this.weatherService.getWeatherSourceSummary(weather);
    const openAiAttempt = await this.openAiPlanningService.createStructuredPlanProposal(request);
    const normalizedOpenAiPlan = openAiAttempt.usedFallback
      ? {
          isValid: false,
          fallbackReason: openAiAttempt.fallbackReason ?? "OpenAI-Planung nicht verfuegbar."
        }
      : this.structuredPlanNormalizer.normalize(openAiAttempt.rawText, request, weather);

    if (normalizedOpenAiPlan.isValid && normalizedOpenAiPlan.days) {
      return {
        days: normalizedOpenAiPlan.days,
        checklist: this.createPlanningChecklist(context.tripId, false),
        agentTrace: this.createPlanningAgentTrace(context.timestamp, false, true, weatherSourceSummary),
        agentInsights: this.createPlanningAgentInsights(false, true, weatherSourceSummary),
        messageParts: [`Ich habe einen AI-generierten ${request.durationDays}-Tage-Plan fuer ${request.destination} erstellt.`],
        warnings: ["Kosten sind grobe Planungsschaetzungen; das finale Budget wurde deterministisch im Backend berechnet."],
        usedDestinationFallback: false,
        usedOpenAiPlanning: true
      };
    }

    const plan = this.tripPlanFactory.createMockPlan(request, weather);
    const fallbackReason = normalizedOpenAiPlan.fallbackReason ?? "OpenAI-Planung konnte nicht validiert werden.";
    return {
      days: plan.days,
      checklist: this.createPlanningChecklist(context.tripId, plan.usedDestinationFallback),
      agentTrace: this.createPlanningAgentTrace(context.timestamp, plan.usedDestinationFallback, false, weatherSourceSummary, fallbackReason),
      agentInsights: this.createPlanningAgentInsights(plan.usedDestinationFallback, false, weatherSourceSummary, fallbackReason),
      messageParts: plan.messageParts,
      warnings: [`OpenAI Structured Planning nicht genutzt: ${fallbackReason}`, ...plan.warnings],
      usedDestinationFallback: plan.usedDestinationFallback,
      usedOpenAiPlanning: false
    };
  }

  private createPlanningChecklist(tripId: string, usedDestinationFallback: boolean): Checklist {
    return {
      id: `checklist_${tripId}`,
      tripId,
      items: [
        {
          id: "check_documents",
          label: "Ausweise und Buchungsunterlagen pruefen",
          category: "documents",
          completed: false,
          priority: "high"
        },
        {
          id: "check_budget",
          label: "Budgetrahmen und Tageskosten pruefen",
          category: "preparation",
          completed: false,
          priority: "medium"
        },
        {
          id: "prepare_weather",
          label: "Wetter vor Reisebeginn erneut pruefen",
          category: "preparation",
          completed: false,
          priority: "medium"
        },
        {
          id: "review_mock_fallback",
          label: usedDestinationFallback
            ? "Mock-Fallback pruefen: Aktivitaeten basieren aktuell auf Berlin-Daten"
            : "Aktivitaeten und Interessen final pruefen",
          category: "preparation",
          completed: false,
          priority: usedDestinationFallback ? "high" : "medium"
        }
      ]
    };
  }

  private createPlanningAgentTrace(
    timestamp: string,
    usedDestinationFallback: boolean,
    usedOpenAiPlanning: boolean,
    weatherSourceSummary: string,
    fallbackReason?: string
  ): AgentTraceEntry[] {
    return [
      { agentName: AGENT_NAMES.coordinator, action: "validate_trip_request", summary: "Reiseanfrage validiert", timestamp },
      { agentName: "Weather Provider", action: "load_weather", summary: weatherSourceSummary, timestamp },
      {
        agentName: AGENT_NAMES.planning,
        action: usedOpenAiPlanning ? "create_openai_structured_plan" : "create_mock_plan",
        summary: this.createPlanningSummary(usedDestinationFallback, usedOpenAiPlanning, fallbackReason),
        timestamp
      },
      {
        agentName: AGENT_NAMES.recommendation,
        action: usedOpenAiPlanning ? "normalize_structured_plan" : "score_activities",
        summary: usedOpenAiPlanning ? "OpenAI-Plan normalisiert und validiert" : "Aktivitaeten bewertet",
        timestamp
      },
      { agentName: AGENT_NAMES.budget, action: "prepare_budget_check", summary: "Budgetberechnung vorbereitet", timestamp },
      { agentName: AGENT_NAMES.checklist, action: "create_checklist", summary: "Checkliste erstellt", timestamp }
    ];
  }

  private createPlanningAgentInsights(
    usedDestinationFallback: boolean,
    usedOpenAiPlanning: boolean,
    weatherSourceSummary: string,
    fallbackReason?: string
  ): AgentInsight[] {
    return [
      { agentName: AGENT_NAMES.coordinator, displayLabel: "Coordinator Agent", status: "completed", summary: "Reiseanfrage validiert" },
      { agentName: "Weather Provider", displayLabel: "Weather Provider", status: "completed", summary: weatherSourceSummary },
      {
        agentName: "OpenAI Structured Planning",
        displayLabel: "OpenAI Structured Planning",
        status: usedOpenAiPlanning ? "completed" : ("failed" satisfies AgentInsightStatus),
        summary: usedOpenAiPlanning
          ? "Strukturierte Planung erfolgreich normalisiert"
          : `Fallback verwendet: ${fallbackReason ?? "OpenAI-Planung nicht verfuegbar"}`
      },
      {
        agentName: AGENT_NAMES.planning,
        displayLabel: "Planning Agent",
        status: "completed",
        summary: usedOpenAiPlanning ? "AI-generierter Plan erstellt" : "Plan mit Mock-Fallback erstellt"
      },
      {
        agentName: AGENT_NAMES.recommendation,
        displayLabel: "Recommendation Agent",
        status: "completed",
        summary: usedOpenAiPlanning ? "OpenAI-Plan normalisiert und validiert" : "Aktivitaeten bewertet"
      },
      { agentName: AGENT_NAMES.budget, displayLabel: "Budget Agent", status: "completed", summary: "Budgetberechnung vorbereitet" },
      { agentName: AGENT_NAMES.checklist, displayLabel: "Checklist Agent", status: "completed", summary: "Checkliste erstellt" }
    ];
  }

  private createPlanningSummary(
    usedDestinationFallback: boolean,
    usedOpenAiPlanning: boolean,
    fallbackReason?: string
  ): string {
    if (usedOpenAiPlanning) {
      return "OpenAI Structured Planning erfolgreich normalisiert";
    }

    return usedDestinationFallback
      ? `Mock-Plan mit transparentem Berlin-Datenfallback erstellt (${fallbackReason ?? "OpenAI nicht genutzt"})`
      : `Mock-Plan aus vorhandenen Zieldaten erstellt (${fallbackReason ?? "OpenAI nicht genutzt"})`;
  }
}
