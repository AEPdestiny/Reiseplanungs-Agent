import { Injectable, NotFoundException } from "@nestjs/common";
import {
  DEMO_TRIP_DESTINATION,
  type Activity,
  type TimeSlot,
  type TravelDay,
  type TripRequest,
  type WeatherSummary
} from "@travel-agent/shared";
import { MockDataService, type MockActivity } from "../../modules/mock-data/mock-data.service";
import { ActivityScoringService } from "../../modules/recommendation/activity-scoring.service";

export interface TripPlanFactoryResult {
  days: TravelDay[];
  messageParts: string[];
  warnings: string[];
  usedDestinationFallback: boolean;
}

@Injectable()
export class TripPlanFactory {
  constructor(
    private readonly mockDataService: MockDataService,
    private readonly activityScoringService: ActivityScoringService
  ) {}

  createMockPlan(request: TripRequest, weather: WeatherSummary[]): TripPlanFactoryResult {
    const usedDestinationFallback = !this.hasDestinationMockData(request.destination);

    return {
      days: this.createMockPlannedDays(request, weather),
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

  private hasDestinationMockData(destination: string): boolean {
    return destination.trim().toLowerCase() === DEMO_TRIP_DESTINATION.toLowerCase();
  }
}
