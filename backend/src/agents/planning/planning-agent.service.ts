import { Injectable } from "@nestjs/common";
import {
  AGENT_NAMES,
  type AgentInsight,
  type AgentTraceEntry,
  type Checklist,
  type TravelDay,
  type TripRequest
} from "@travel-agent/shared";
import { WeatherService } from "../../modules/weather/weather.service";
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
}

@Injectable()
export class PlanningAgentService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly tripPlanFactory: TripPlanFactory
  ) {}

  async createInitialPlanFromRequest(request: TripRequest, context: PlanningContext): Promise<PlanningResult> {
    const weather = await this.weatherService.getWeatherForTrip(request);
    const plan = this.tripPlanFactory.createMockPlan(request, weather);

    return {
      days: plan.days,
      checklist: this.createPlanningChecklist(context.tripId, plan.usedDestinationFallback),
      agentTrace: this.createPlanningAgentTrace(context.timestamp, plan.usedDestinationFallback),
      agentInsights: this.createPlanningAgentInsights(plan.usedDestinationFallback),
      messageParts: plan.messageParts,
      warnings: plan.warnings,
      usedDestinationFallback: plan.usedDestinationFallback
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

  private createPlanningAgentTrace(timestamp: string, usedDestinationFallback: boolean): AgentTraceEntry[] {
    return [
      { agentName: AGENT_NAMES.coordinator, action: "validate_trip_request", summary: "Reiseanfrage validiert", timestamp },
      {
        agentName: AGENT_NAMES.planning,
        action: "create_mock_plan",
        summary: usedDestinationFallback
          ? "Mock-Plan mit transparentem Berlin-Datenfallback erstellt"
          : "Mock-Plan aus vorhandenen Zieldaten erstellt",
        timestamp
      },
      { agentName: AGENT_NAMES.recommendation, action: "score_activities", summary: "Aktivitaeten bewertet", timestamp },
      { agentName: AGENT_NAMES.budget, action: "prepare_budget_check", summary: "Budgetberechnung vorbereitet", timestamp },
      { agentName: AGENT_NAMES.checklist, action: "create_checklist", summary: "Checkliste erstellt", timestamp }
    ];
  }

  private createPlanningAgentInsights(usedDestinationFallback: boolean): AgentInsight[] {
    return [
      { agentName: AGENT_NAMES.coordinator, displayLabel: "Coordinator Agent", status: "completed", summary: "Reiseanfrage validiert" },
      {
        agentName: AGENT_NAMES.planning,
        displayLabel: "Planning Agent",
        status: "completed",
        summary: usedDestinationFallback
          ? "Plan mit Berlin-Mockdaten als Fallback erstellt"
          : "Plan aus vorhandenen Mockdaten erstellt"
      },
      { agentName: AGENT_NAMES.recommendation, displayLabel: "Recommendation Agent", status: "completed", summary: "Aktivitaeten bewertet" },
      { agentName: AGENT_NAMES.budget, displayLabel: "Budget Agent", status: "completed", summary: "Budgetberechnung vorbereitet" },
      { agentName: AGENT_NAMES.checklist, displayLabel: "Checklist Agent", status: "completed", summary: "Checkliste erstellt" }
    ];
  }
}
