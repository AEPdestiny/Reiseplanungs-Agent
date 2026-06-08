import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AGENT_NAMES,
  type Activity,
  type AgentInsight,
  type AgentTraceEntry,
  type Checklist,
  type TimeSlot,
  type TravelDay,
  type TripRequest,
  type WeatherSummary
} from "@travel-agent/shared";
import { MockDataService, type MockActivity } from "../mock-data/mock-data.service";
import { ActivityScoringService } from "../recommendation/activity-scoring.service";

export interface DemoTripBuildResult {
  days: TravelDay[];
  checklist: Checklist;
  agentTrace: AgentTraceEntry[];
  agentInsights: AgentInsight[];
}

export interface MockPlannedTripBuildResult extends DemoTripBuildResult {
  usedDestinationFallback: boolean;
}

@Injectable()
export class DemoTripFactory {
  constructor(
    private readonly mockDataService: MockDataService,
    private readonly activityScoringService: ActivityScoringService
  ) {}

  buildBerlinDemoTrip(tripId: string, request: TripRequest, weather: WeatherSummary[], timestamp: string): DemoTripBuildResult {
    return {
      days: this.createDemoDays(request, weather),
      checklist: this.createDemoChecklist(tripId),
      agentTrace: this.createDemoAgentTrace(timestamp),
      agentInsights: this.createDemoAgentInsights()
    };
  }

  buildMockPlannedTrip(
    tripId: string,
    request: TripRequest,
    weather: WeatherSummary[],
    timestamp: string,
    usedDestinationFallback: boolean
  ): MockPlannedTripBuildResult {
    return {
      days: this.createMockPlannedDays(request, weather),
      checklist: this.createPlanningChecklist(tripId, usedDestinationFallback),
      agentTrace: this.createPlanningAgentTrace(timestamp, usedDestinationFallback),
      agentInsights: this.createPlanningAgentInsights(usedDestinationFallback),
      usedDestinationFallback
    };
  }

  private createDemoDays(request: TripRequest, weather: WeatherSummary[]): TravelDay[] {
    return [
      {
        dayNumber: 1,
        title: "Ankommen und Berlin-Mitte",
        weather: weather[0],
        timeSlots: [
          this.createTimeSlot("day1-slot1", "10:00", "10:45", this.createActivity("brandenburg-gate", request, weather, 1, "Mitte")),
          this.createTimeSlot("day1-slot2", "11:00", "13:30", this.createActivity("museum-island", request, weather, 1, "Mitte")),
          this.createTimeSlot("day1-slot3", "14:00", "14:45", this.createActivity("cafe-break-mitte", request, weather, 1, "Mitte")),
          this.createTimeSlot("day1-slot4", "18:30", "20:00", this.createActivity("restaurant-mitte", request, weather, 1, "Mitte")),
          this.createTimeSlot("day1-slot5", "20:15", "20:45", this.createActivity("local-transit-day-ticket", request, weather, 1, "Berlin"))
        ]
      },
      {
        dayNumber: 2,
        title: "Kunst, Geschichte und Spaziergaenge",
        weather: weather[1],
        timeSlots: [
          this.createTimeSlot("day2-slot1", "10:00", "11:15", this.createActivity("east-side-gallery", request, weather, 2, "Friedrichshain")),
          this.createTimeSlot("day2-slot2", "12:00", "13:15", this.createActivity("markthalle-neun", request, weather, 2, "Kreuzberg")),
          this.createTimeSlot("day2-slot3", "14:00", "15:15", this.createActivity("tiergarten-walk", request, weather, 2, "Tiergarten")),
          this.createTimeSlot("day2-slot4", "18:30", "20:00", this.createActivity("kreuzberg-dinner", request, weather, 2, "Kreuzberg")),
          this.createTimeSlot("day2-slot5", "20:15", "20:45", this.createActivity("local-transit-day-ticket", request, weather, 2, "Berlin"))
        ]
      },
      {
        dayNumber: 3,
        title: "West-Berlin und entspannter Abschluss",
        weather: weather[2],
        timeSlots: [
          this.createTimeSlot("day3-slot1", "10:00", "11:15", this.createActivity("reichstag-dome", request, weather, 3, "Mitte")),
          this.createTimeSlot("day3-slot2", "12:00", "14:00", this.createActivity("charlottenburg-palace", request, weather, 3, "Charlottenburg")),
          this.createTimeSlot("day3-slot3", "15:00", "17:00", this.createActivity("berlinische-galerie", request, weather, 3, "Kreuzberg")),
          this.createTimeSlot("day3-slot4", "18:30", "20:00", this.createActivity("savignyplatz-dinner", request, weather, 3, "Charlottenburg")),
          this.createTimeSlot("day3-slot5", "20:15", "20:45", this.createActivity("local-transit-day-ticket", request, weather, 3, "Berlin"))
        ]
      }
    ];
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
          code: "DEMO_ACTIVITY_NOT_FOUND",
          message: `Demo-Aktivitaet wurde nicht gefunden: ${activityId}`
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

  private createDemoChecklist(tripId: string): Checklist {
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
          id: "pack_rain_jacket",
          label: "Leichte Regenjacke einpacken",
          category: "packing",
          completed: false,
          priority: "medium"
        },
        {
          id: "prepare_transit",
          label: "OPNV-App oder Ticketoption vorbereiten",
          category: "preparation",
          completed: false,
          priority: "medium"
        }
      ]
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

  private createDemoAgentTrace(timestamp: string): AgentTraceEntry[] {
    return [
      { agentName: AGENT_NAMES.coordinator, action: "analyze_request", summary: "Anfrage analysiert", timestamp },
      { agentName: AGENT_NAMES.planning, action: "create_day_structure", summary: "Tagesstruktur erstellt", timestamp },
      { agentName: AGENT_NAMES.recommendation, action: "score_activities", summary: "Aktivitaeten bewertet", timestamp },
      { agentName: AGENT_NAMES.budget, action: "calculate_budget", summary: "Budget geprueft", timestamp },
      { agentName: AGENT_NAMES.checklist, action: "create_checklist", summary: "Checkliste erstellt", timestamp }
    ];
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
      { agentName: AGENT_NAMES.budget, action: "calculate_budget", summary: "Budget deterministisch berechnet", timestamp },
      { agentName: AGENT_NAMES.checklist, action: "create_checklist", summary: "Checkliste erstellt", timestamp }
    ];
  }

  private createDemoAgentInsights(): AgentInsight[] {
    return [
      { agentName: AGENT_NAMES.coordinator, displayLabel: "Coordinator Agent", status: "completed", summary: "Anfrage analysiert" },
      { agentName: AGENT_NAMES.planning, displayLabel: "Planning Agent", status: "completed", summary: "Tagesstruktur erstellt" },
      { agentName: AGENT_NAMES.recommendation, displayLabel: "Recommendation Agent", status: "completed", summary: "Aktivitaeten bewertet" },
      { agentName: AGENT_NAMES.budget, displayLabel: "Budget Agent", status: "completed", summary: "Budget geprueft" },
      { agentName: AGENT_NAMES.checklist, displayLabel: "Checklist Agent", status: "completed", summary: "Checkliste erstellt" }
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
      { agentName: AGENT_NAMES.budget, displayLabel: "Budget Agent", status: "completed", summary: "Budget deterministisch berechnet" },
      { agentName: AGENT_NAMES.checklist, displayLabel: "Checklist Agent", status: "completed", summary: "Checkliste erstellt" }
    ];
  }
}
