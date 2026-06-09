import { Injectable } from "@nestjs/common";
import {
  AGENT_NAMES,
  type AgentInsight,
  type AgentTraceEntry,
  type Checklist,
  type TravelDay,
  type TripRequest,
  type WeatherSummary
} from "@travel-agent/shared";
import { RecommendationAgentService } from "../recommendation/recommendation-agent.service";
import { PlacesService } from "../../modules/places/places.service";
import { WeatherService } from "../../modules/weather/weather.service";
import { OpenAiPlanningService } from "./openai-planning.service";
import { StructuredPlanNormalizer } from "./structured-plan-normalizer";

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
  private readonly openAiPlanningEnabled = process.env.OPENAI_PLANNING_ENABLED === "true";

  constructor(
    private readonly weatherService: WeatherService,
    private readonly placesService: PlacesService,
    private readonly recommendationAgentService: RecommendationAgentService,
    private readonly openAiPlanningService: OpenAiPlanningService,
    private readonly structuredPlanNormalizer: StructuredPlanNormalizer
  ) {}

  async createInitialPlanFromRequest(request: TripRequest, context: PlanningContext): Promise<PlanningResult> {
    const weather = await this.weatherService.getWeatherForTrip(request);
    const geocodingSourceSummary = this.weatherService.getGeocodingSourceSummary(weather);
    const weatherSourceSummary = this.weatherService.getWeatherSourceSummary(weather);
    const placesLookup = await this.placesService.getPlacesForDestination(request.destination, request.interests);
    const placesSourceSummary = this.placesService.getPlacesSourceSummary(placesLookup);
    const detailedPlacesSourceSummaries = this.placesService.getDetailedSourceSummaries(placesLookup);
    const placesPlan = placesLookup.hasMinimumPlaces
      ? this.recommendationAgentService.createPlanFromPlaces(request, placesLookup.places, weather)
      : null;

    if (placesPlan) {
      return {
        days: placesPlan,
        checklist: this.createPlanningChecklist(context.tripId, false),
        agentTrace: this.createPlanningAgentTrace(
          context.timestamp,
          false,
          false,
          geocodingSourceSummary,
          weatherSourceSummary,
          placesSourceSummary,
          true
        ),
        agentInsights: this.createPlanningAgentInsights(
          false,
          false,
          geocodingSourceSummary,
          weatherSourceSummary,
          undefined,
          placesSourceSummary,
          detailedPlacesSourceSummaries,
          true
        ),
        messageParts: [`Ich habe echte POI-Daten fuer ${request.destination} genutzt und daraus einen Tagesplan erstellt.`],
        warnings: ["Places-Daten stammen aus kostenfreien Quellen; Kosten bleiben grobe Planungsschaetzungen."],
        usedDestinationFallback: false,
        usedOpenAiPlanning: false
      };
    }

    const optionalOpenAiPlan = this.openAiPlanningEnabled
      ? await this.tryCreateOptionalOpenAiPlan(request, context, weather, geocodingSourceSummary, weatherSourceSummary, placesSourceSummary)
      : undefined;

    if (optionalOpenAiPlan?.result) {
      return optionalOpenAiPlan.result;
    }

    const genericPlan = this.recommendationAgentService.createGenericDestinationPlan(request, weather);
    const fallbackReason =
      optionalOpenAiPlan?.fallbackReason ??
      "Free-API-Places lieferten zu wenige POIs; generischer Zielplan ohne Berlin-Mock-Aktivitaeten wurde verwendet.";

    return {
      days: genericPlan,
      checklist: this.createPlanningChecklist(context.tripId, true),
      agentTrace: this.createPlanningAgentTrace(
        context.timestamp,
        true,
        false,
        geocodingSourceSummary,
        weatherSourceSummary,
        placesSourceSummary,
        false,
        fallbackReason
      ),
      agentInsights: this.createPlanningAgentInsights(
        true,
        false,
        geocodingSourceSummary,
        weatherSourceSummary,
        fallbackReason,
        placesSourceSummary,
        detailedPlacesSourceSummaries,
        false,
        this.openAiPlanningEnabled
      ),
      messageParts: [`Ich habe einen generischen Minimalplan fuer ${request.destination} erstellt.`],
      warnings: [fallbackReason],
      usedDestinationFallback: true,
      usedOpenAiPlanning: false
    };
  }

  private async tryCreateOptionalOpenAiPlan(
    request: TripRequest,
    context: PlanningContext,
    weather: WeatherSummary[],
    geocodingSourceSummary: string,
    weatherSourceSummary: string,
    placesSourceSummary: string
  ): Promise<{ result?: PlanningResult; fallbackReason?: string }> {
    const openAiAttempt = await this.openAiPlanningService.createStructuredPlanProposal(request);
    const normalizedOpenAiPlan = openAiAttempt.usedFallback
      ? {
          isValid: false,
          fallbackReason: openAiAttempt.fallbackReason ?? "OpenAI-Planung nicht verfuegbar."
        }
      : this.structuredPlanNormalizer.normalize(openAiAttempt.rawText, request, weather);

    if (normalizedOpenAiPlan.isValid && normalizedOpenAiPlan.days) {
      return {
        result: {
          days: normalizedOpenAiPlan.days,
          checklist: this.createPlanningChecklist(context.tripId, false),
          agentTrace: this.createPlanningAgentTrace(
            context.timestamp,
            false,
            true,
            geocodingSourceSummary,
            weatherSourceSummary,
            placesSourceSummary
          ),
          agentInsights: this.createPlanningAgentInsights(
            false,
            true,
            geocodingSourceSummary,
            weatherSourceSummary,
            undefined,
            placesSourceSummary,
            [placesSourceSummary],
            false,
            true
          ),
          messageParts: [`Ich habe einen optional AI-generierten ${request.durationDays}-Tage-Plan fuer ${request.destination} erstellt.`],
          warnings: ["Kosten sind grobe Planungsschaetzungen; das finale Budget wurde deterministisch im Backend berechnet."],
          usedDestinationFallback: false,
          usedOpenAiPlanning: true
        }
      };
    }

    return {
      fallbackReason: normalizedOpenAiPlan.fallbackReason ?? "Optionale OpenAI-Planung konnte nicht validiert werden."
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
            ? "Generischen Zielplan pruefen und bei Bedarf lokale POIs ergaenzen"
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
    geocodingSourceSummary: string,
    weatherSourceSummary: string,
    placesSourceSummary = "Places Source: Generic Destination Plan",
    usedPlacesPlanning = false,
    fallbackReason?: string
  ): AgentTraceEntry[] {
    return [
      { agentName: AGENT_NAMES.coordinator, action: "validate_trip_request", summary: "Reiseanfrage validiert", timestamp },
      { agentName: "Geocoding Provider", action: "geocode_destination", summary: geocodingSourceSummary, timestamp },
      { agentName: "Weather Provider", action: "load_weather", summary: weatherSourceSummary, timestamp },
      { agentName: "Places Provider", action: "load_places", summary: placesSourceSummary, timestamp },
      {
        agentName: AGENT_NAMES.planning,
        action: usedPlacesPlanning
          ? "create_places_plan"
          : usedOpenAiPlanning
            ? "create_openai_structured_plan"
            : "create_generic_destination_plan",
        summary: this.createPlanningSummary(usedDestinationFallback, usedOpenAiPlanning, fallbackReason, usedPlacesPlanning),
        timestamp
      },
      {
        agentName: AGENT_NAMES.recommendation,
        action: usedOpenAiPlanning ? "normalize_structured_plan" : "score_activities",
        summary: usedOpenAiPlanning ? "OpenAI-Plan normalisiert und validiert" : "Recommendation Score applied",
        timestamp
      },
      { agentName: AGENT_NAMES.budget, action: "prepare_budget_check", summary: "Budgetberechnung vorbereitet", timestamp },
      { agentName: AGENT_NAMES.checklist, action: "create_checklist", summary: "Checkliste erstellt", timestamp }
    ];
  }

  private createPlanningAgentInsights(
    usedDestinationFallback: boolean,
    usedOpenAiPlanning: boolean,
    geocodingSourceSummary: string,
    weatherSourceSummary: string,
    fallbackReason?: string,
    placesSourceSummary = "Places Source: Generic Destination Plan",
    detailedPlacesSourceSummaries: string[] = [placesSourceSummary],
    usedPlacesPlanning = false,
    openAiPlanningAttempted = usedOpenAiPlanning
  ): AgentInsight[] {
    const insights: AgentInsight[] = [
      { agentName: AGENT_NAMES.coordinator, displayLabel: "Coordinator Agent", status: "completed", summary: "Reiseanfrage validiert" },
      { agentName: "Geocoding Provider", displayLabel: "Geocoding Provider", status: "completed", summary: geocodingSourceSummary },
      { agentName: "Weather Provider", displayLabel: "Weather Provider", status: "completed", summary: weatherSourceSummary }
    ];

    for (const summary of detailedPlacesSourceSummaries) {
      insights.push({ agentName: "Places Provider", displayLabel: "Places Provider", status: "completed", summary });
    }

    if (openAiPlanningAttempted || usedOpenAiPlanning) {
      insights.push({
        agentName: "OpenAI Structured Planning",
        displayLabel: "OpenAI Structured Planning",
        status: usedOpenAiPlanning ? "completed" : "failed",
        summary: usedOpenAiPlanning
          ? "Strukturierte Planung erfolgreich normalisiert"
          : `Optionaler OpenAI-Pfad nicht genutzt: ${fallbackReason ?? "OpenAI-Planung nicht verfuegbar"}`
      });
    }

    insights.push(
      {
        agentName: AGENT_NAMES.planning,
        displayLabel: "Planning Agent",
        status: "completed",
        summary: usedPlacesPlanning
          ? "Planning Agent: Real Data Plan erstellt"
          : usedOpenAiPlanning
            ? "AI-generierter Plan erstellt"
            : "Planning Agent: Generic Destination Plan erstellt"
      },
      {
        agentName: AGENT_NAMES.recommendation,
        displayLabel: "Recommendation Agent",
        status: "completed",
        summary: usedOpenAiPlanning ? "OpenAI-Plan normalisiert und validiert" : "Recommendation Score applied"
      },
      { agentName: AGENT_NAMES.budget, displayLabel: "Budget Agent", status: "completed", summary: "Budgetberechnung vorbereitet" },
      { agentName: AGENT_NAMES.checklist, displayLabel: "Checklist Agent", status: "completed", summary: "Checkliste erstellt" }
    );

    return insights;
  }

  private createPlanningSummary(
    usedDestinationFallback: boolean,
    usedOpenAiPlanning: boolean,
    fallbackReason?: string,
    usedPlacesPlanning = false
  ): string {
    if (usedPlacesPlanning) {
      return "Planning Agent: Real Data Plan erstellt";
    }

    if (usedOpenAiPlanning) {
      return "OpenAI Structured Planning erfolgreich normalisiert";
    }

    return usedDestinationFallback
      ? `Planning Agent: Generic Destination Plan erstellt (${fallbackReason ?? "keine ausreichenden echten POIs"})`
      : `Planning Agent: Real Data Plan erstellt (${fallbackReason ?? "Free APIs genutzt"})`;
  }
}
