import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AGENT_NAMES,
  DEMO_TRIP_DESTINATION,
  type Activity,
  type AgentInsight,
  type AgentTraceEntry,
  type Checklist,
  type TimeSlot,
  type TravelDay,
  type TripRequest,
  type WeatherSummary
} from "@travel-agent/shared";
import { MockDataService, type MockActivity } from "../../modules/mock-data/mock-data.service";
import { ActivityScoringService } from "../../modules/recommendation/activity-scoring.service";
import { WeatherService } from "../../modules/weather/weather.service";

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
    private readonly mockDataService: MockDataService,
    private readonly activityScoringService: ActivityScoringService
  ) {}

  async createInitialPlanFromRequest(request: TripRequest, context: PlanningContext): Promise<PlanningResult> {
    const weather = await this.weatherService.getWeatherForTrip(request);
    const usedDestinationFallback = !this.hasDestinationMockData(request.destination);

    return {
      days: this.createMockPlannedDays(request, weather),
      checklist: this.createPlanningChecklist(context.tripId, usedDestinationFallback),
      agentTrace: this.createPlanningAgentTrace(context.timestamp, usedDestinationFallback),
      agentInsights: this.createPlanningAgentInsights(usedDestinationFallback),
      messageParts: [`Ich habe einen ${request.durationDays}-Tage-Plan fuer ${request.destination} erstellt.`],
      warnings: usedDestinationFallback
        ? [
            "Fuer dieses Ziel gibt es noch keine eigenen Mock-Daten; der Plan nutzt kontrolliert die vorhandenen Berlin-Mockdaten als Fallback."
          ]
        : [],
      usedDestinationFallback
    };
  }

  private createMockPlannedDays(request: TripRequest, weather: WeatherSummary[]): TravelDay[] {
    const dayTemplates = [
      {
        title: "Ankommen und Stadtueberblick",
        preferredArea: "Mitte",
        activityIds: ["brandenburg-gate", "museum-island", "cafe-break-mitte", "restaurant-mitte", "local-transit-day-ticket"]
      },
      {
        title: "Kultur, Essen und flexible Wege",
        preferredArea: "Kreuzberg",
        activityIds: ["east-side-gallery", "markthalle-neun", "berlinische-galerie", "kreuzberg-dinner", "local-transit-day-ticket"]
      },
      {
        title: "Geschichte und entspannter Abschluss",
        preferredArea: "Charlottenburg",
        activityIds: ["reichstag-dome", "charlottenburg-palace", "technology-museum", "savignyplatz-dinner", "local-transit-day-ticket"]
      }
    ];
    const timeWindows = [
      ["10:00", "11:00"],
      ["11:30", "13:30"],
      ["14:30", "15:15"],
      ["18:30", "20:00"],
      ["20:15", "20:45"]
    ];

    return Array.from({ length: request.durationDays }, (_, index) => {
      const dayNumber = index + 1;
      const template = dayTemplates[index % dayTemplates.length];

      return {
        dayNumber,
        title: `${template.title} in ${request.destination}`,
        weather: weather.find((item) => item.dayNumber === dayNumber),
        timeSlots: template.activityIds.map((activityId, slotIndex) => {
          const [startTime, endTime] = timeWindows[slotIndex];
          return this.createTimeSlot(
            `day${dayNumber}-slot${slotIndex + 1}`,
            startTime,
            endTime,
            this.createActivity(activityId, request, weather, dayNumber, template.preferredArea)
          );
        })
      };
    });
  }

  private createActivity(
    activityId: string,
    request: TripRequest,
    weather: WeatherSummary[],
    dayNumber: number,
    preferredArea?: string
  ): Activity {
    const mockActivity = this.getRequiredActivity(activityId);
    const dayWeather = weather.find((item) => item.dayNumber === dayNumber);
    const estimatedCostTotal = mockActivity.estimatedCostPerPerson * request.numberOfPeople;

    return {
      ...mockActivity,
      estimatedCostTotal,
      location: { ...mockActivity.location },
      score: this.activityScoringService.calculateActivityScore(mockActivity, request, dayWeather, preferredArea)
    };
  }

  private getRequiredActivity(activityId: string): MockActivity {
    const activity = this.mockDataService.getActivityById(activityId);

    if (!activity) {
      throw new NotFoundException({
        error: {
          code: "PLANNING_ACTIVITY_NOT_FOUND",
          message: `Planungsaktivitaet wurde nicht gefunden: ${activityId}`
        }
      });
    }

    return activity;
  }

  private createTimeSlot(id: string, startTime: string, endTime: string, activity: Activity): TimeSlot {
    return {
      id,
      startTime,
      endTime,
      activity
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

  private hasDestinationMockData(destination: string): boolean {
    return destination.trim().toLowerCase() === DEMO_TRIP_DESTINATION.toLowerCase();
  }
}
