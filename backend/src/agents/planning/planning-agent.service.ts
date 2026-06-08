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
  private readonly openAiPlanningEnabled = process.env.OPENAI_PLANNING_ENABLED === "true";

  constructor(
    private readonly weatherService: WeatherService,
    private readonly placesService: PlacesService,
    private readonly recommendationAgentService: RecommendationAgentService,
    private readonly openAiPlanningService: OpenAiPlanningService,
    private readonly structuredPlanNormalizer: StructuredPlanNormalizer,
    private readonly tripPlanFactory: TripPlanFactory
  ) {}

  async createInitialPlanFromRequest(request: TripRequest, context: PlanningContext): Promise<PlanningResult> {
    const weather = await this.weatherService.getWeatherForTrip(request);
    const geocodingSourceSummary = this.weatherService.getGeocodingSourceSummary(weather);
    const weatherSourceSummary = this.weatherService.getWeatherSourceSummary(weather);
    const placesLookup = await this.placesService.getPlacesForDestination(request.destination, request.interests);
    const placesSourceSummary = this.placesService.getPlacesSourceSummary(placesLookup);
    const placesPlan = this.recommendationAgentService.createPlanFromPlaces(request, placesLookup.places, weather);

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
          true
        ),
        messageParts: [`Ich habe echte POI-Daten fuer ${request.destination} genutzt und daraus einen Tagesplan erstellt.`],
        warnings: ["Places-Daten stammen aus Wikidata; Kosten bleiben grobe Planungsschaetzungen."],
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

    const plan = this.tripPlanFactory.createMockPlan(request, weather);
    const fallbackReason =
      optionalOpenAiPlan?.fallbackReason ?? "Free-API-Places lieferten keinen nutzbaren Plan; Mock-Fallback wurde verwendet.";

    return {
      days: plan.days,
      checklist: this.createPlanningChecklist(context.tripId, plan.usedDestinationFallback),
      agentTrace: this.createPlanningAgentTrace(
        context.timestamp,
        plan.usedDestinationFallback,
        false,
        geocodingSourceSummary,
        weatherSourceSummary,
        placesSourceSummary,
        false,
        fallbackReason
      ),
      agentInsights: this.createPlanningAgentInsights(
        plan.usedDestinationFallback,
        false,
        geocodingSourceSummary,
        weatherSourceSummary,
        fallbackReason,
        placesSourceSummary,
        false,
        this.openAiPlanningEnabled
      ),
      messageParts: plan.messageParts,
      warnings: [fallbackReason, ...plan.warnings],
      usedDestinationFallback: plan.usedDestinationFallback,
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
    geocodingSourceSummary: string,
    weatherSourceSummary: string,
    placesSourceSummary = "Places Source: Mock Fallback",
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
            : "create_mock_plan",
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
    placesSourceSummary = "Places Source: Mock Fallback",
    usedPlacesPlanning = false,
    openAiPlanningAttempted = usedOpenAiPlanning
  ): AgentInsight[] {
    const insights: AgentInsight[] = [
      { agentName: AGENT_NAMES.coordinator, displayLabel: "Coordinator Agent", status: "completed", summary: "Reiseanfrage validiert" },
      { agentName: "Geocoding Provider", displayLabel: "Geocoding Provider", status: "completed", summary: geocodingSourceSummary },
      { agentName: "Weather Provider", displayLabel: "Weather Provider", status: "completed", summary: weatherSourceSummary },
      { agentName: "Places Provider", displayLabel: "Places Provider", status: "completed", summary: placesSourceSummary }
    ];

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
          ? "Plan aus Free-API-Places erstellt"
          : usedOpenAiPlanning
            ? "AI-generierter Plan erstellt"
            : "Plan mit Mock-Fallback erstellt"
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
      return "Plan aus Wikidata-POIs und deterministischem Recommendation Scoring erstellt";
    }

    if (usedOpenAiPlanning) {
      return "OpenAI Structured Planning erfolgreich normalisiert";
    }

    return usedDestinationFallback
      ? `Mock-Plan mit transparentem Berlin-Datenfallback erstellt (${fallbackReason ?? "OpenAI nicht genutzt"})`
      : `Mock-Plan aus vorhandenen Zieldaten erstellt (${fallbackReason ?? "OpenAI nicht genutzt"})`;
  }
}
