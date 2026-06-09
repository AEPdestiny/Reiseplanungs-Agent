import { Injectable } from "@nestjs/common";
import type { Activity, ActivityCategory, TimeSlot, TravelDay, TripRequest, WeatherSummary } from "@travel-agent/shared";
import type { PlaceCategory, PlaceResult } from "../../modules/places/places-provider.interface";
import { ActivityScoringService } from "../../modules/recommendation/activity-scoring.service";

@Injectable()
export class RecommendationAgentService {
  constructor(private readonly activityScoringService: ActivityScoringService) {}

  createGenericDestinationPlan(request: TripRequest, weather: WeatherSummary[]): TravelDay[] {
    return Array.from({ length: request.durationDays }, (_, index) => {
      const dayNumber = index + 1;
      const dayWeather = weather.find((summary) => summary.dayNumber === dayNumber);
      const dayActivities = this.createGenericActivitiesForDay(request, dayNumber, dayWeather);

      return {
        dayNumber,
        title: `${request.destination}: flexibler Orientierungstag ${dayNumber}`,
        weather: dayWeather,
        timeSlots: this.createTimeSlots(dayActivities, dayNumber, request, dayWeather)
      };
    });
  }

  createPlanFromPlaces(request: TripRequest, places: PlaceResult[], weather: WeatherSummary[]): TravelDay[] | null {
    if (places.length < 3) {
      return null;
    }

    const recommendedActivities = places
      .map((place) => this.createActivityFromPlace(place, request))
      .sort((left, right) => this.getQualityScore(right) - this.getQualityScore(left) || left.name.localeCompare(right.name));

    const days: TravelDay[] = [];
    const usedActivityIds = new Set<string>();

    for (let dayNumber = 1; dayNumber <= request.durationDays; dayNumber += 1) {
      const dayWeather = weather.find((summary) => summary.dayNumber === dayNumber);
      const dayActivities = this.pickActivitiesForDay(recommendedActivities, dayNumber, request, dayWeather, usedActivityIds);
      const scoredTimeSlots = this.createTimeSlots(dayActivities, dayNumber, request, dayWeather);

      for (const activity of dayActivities) {
        usedActivityIds.add(activity.id);
      }

      days.push({
        dayNumber,
        title: `${request.destination}: Empfehlungen Tag ${dayNumber}`,
        weather: dayWeather,
        timeSlots: scoredTimeSlots
      });
    }

    return days;
  }

  private createActivityFromPlace(place: PlaceResult, request: TripRequest): Activity {
    const estimatedCostPerPerson = place.estimatedCostPerPerson ?? 0;

    return {
      id: `place_${place.id}`,
      name: place.name,
      category: this.mapPlaceCategory(place.category),
      description: place.description,
      location: {
        name: place.name,
        lat: place.latitude,
        lng: place.longitude,
        area: request.destination
      },
      estimatedCostPerPerson,
      estimatedCostTotal: estimatedCostPerPerson * request.numberOfPeople,
      durationMinutes: this.durationForCategory(place.category),
      indoorOutdoor: place.indoor === undefined ? "mixed" : place.indoor ? "indoor" : "outdoor",
      tags: Array.from(new Set([place.category, `quality:${place.qualityScore ?? 0}`, ...place.tags])),
      reasoning: `${place.name} wurde aus ${place.source} als passende Aktivitaet fuer ${request.destination} uebernommen.`,
      source: "external_api"
    };
  }

  private pickActivitiesForDay(
    activities: Activity[],
    dayNumber: number,
    request: TripRequest,
    weatherSummary: WeatherSummary | undefined,
    usedActivityIds: Set<string>
  ): Activity[] {
    const scoredActivities = activities
      .filter((activity) => !usedActivityIds.has(activity.id))
      .map((activity) => ({
        activity,
        score: this.activityScoringService.calculateActivityScore(activity, request, weatherSummary, request.destination),
        finalScore: this.calculateFinalRecommendationScore(activity, request, weatherSummary)
      }))
      .sort((left, right) => right.finalScore - left.finalScore || left.activity.name.localeCompare(right.activity.name));

    const picked = this.pickDiverseActivities(scoredActivities, 3).map((entry) => entry.activity);

    if (picked.length >= 3) {
      return picked;
    }

    return [...picked, ...this.pickDiverseActivities(scoredActivities, 3 - picked.length).map((entry) => entry.activity)];
  }

  private createTimeSlots(
    activities: Activity[],
    dayNumber: number,
    request: TripRequest,
    weatherSummary?: WeatherSummary
  ): TimeSlot[] {
    const timeWindows = [
      { startTime: "10:00", endTime: "11:30" },
      { startTime: "14:00", endTime: "15:30" },
      { startTime: "18:30", endTime: "20:00" }
    ];

    return activities.map((activity, index) => {
      const score = this.activityScoringService.calculateActivityScore(activity, request, weatherSummary, request.destination);

      return {
        id: `day_${dayNumber}_place_slot_${index + 1}`,
        ...timeWindows[index],
        activity: {
          ...activity,
          score
        },
        notes: score.explanation
      };
    });
  }

  private createGenericActivitiesForDay(request: TripRequest, dayNumber: number, weatherSummary?: WeatherSummary): Activity[] {
    const weatherCondition = weatherSummary?.condition.toLowerCase() ?? "";
    const prefersIndoor = weatherCondition.includes("rain") || weatherCondition.includes("regen");
    const baseId = this.normalizeIdPart(request.destination);

    const activities: Activity[] = [
      {
        id: `generic_${baseId}_orientation_${dayNumber}`,
        name: `${request.destination} Orientierung und Stadtzentrum`,
        category: "sightseeing",
        description: `Starte mit einer kompakten Orientierung rund um das Zentrum von ${request.destination}.`,
        location: {
          name: `${request.destination} Zentrum`,
          area: request.destination
        },
        estimatedCostPerPerson: 0,
        estimatedCostTotal: 0,
        durationMinutes: 90,
        indoorOutdoor: prefersIndoor ? "mixed" : "outdoor",
        tags: ["orientation", "sehenswuerdigkeiten", prefersIndoor ? "rain_flexible" : "outdoor"],
        reasoning: `Generischer Real-Data-Minimalplan fuer ${request.destination}, weil nicht genug echte POIs verfuegbar waren.`,
        source: "external_api"
      },
      {
        id: `generic_${baseId}_break_${dayNumber}`,
        name: `${request.destination} Essenspause im passenden Viertel`,
        category: "restaurant",
        description: `Plane eine flexible Essenspause in ${request.destination}; konkrete Restaurants koennen spaeter durch Places-Daten ersetzt werden.`,
        location: {
          name: `${request.destination} Restaurantbereich`,
          area: request.destination
        },
        estimatedCostPerPerson: 24,
        estimatedCostTotal: 24 * request.numberOfPeople,
        durationMinutes: 90,
        indoorOutdoor: "indoor",
        tags: ["food", "gutes essen", "indoor"],
        reasoning: "Essenspause als generischer Bestandteil eines realistischen Tagesplans.",
        source: "external_api"
      },
      {
        id: `generic_${baseId}_flex_${dayNumber}`,
        name: prefersIndoor ? `${request.destination} wetterfeste freie Zeit` : `${request.destination} Spaziergang und freie Zeit`,
        category: prefersIndoor ? "activity" : "walk",
        description: prefersIndoor
          ? `Halte Zeit fuer wetterfeste Innenaktivitaeten oder spontane lokale Empfehlungen in ${request.destination} frei.`
          : `Nutze freie Zeit fuer einen Spaziergang, Aussichtspunkte oder spontane lokale Empfehlungen in ${request.destination}.`,
        location: {
          name: `${request.destination} flexibel`,
          area: request.destination
        },
        estimatedCostPerPerson: prefersIndoor ? 10 : 0,
        estimatedCostTotal: (prefersIndoor ? 10 : 0) * request.numberOfPeople,
        durationMinutes: 90,
        indoorOutdoor: prefersIndoor ? "indoor" : "outdoor",
        tags: prefersIndoor ? ["rain_safe", "indoor", "flexible"] : ["spaziergaenge", "outdoor", "flexible"],
        reasoning: "Flexibler Slot verhindert falsche Ortsbehauptungen, wenn externe POI-Daten zu duenn sind.",
        source: "external_api"
      }
    ];

    return activities;
  }

  private mapPlaceCategory(category: PlaceCategory): ActivityCategory {
    const categoryMap: Record<PlaceCategory, ActivityCategory> = {
      museum: "museum",
      landmark: "sightseeing",
      park: "walk",
      historic_site: "sightseeing",
      food: "restaurant",
      shopping: "activity",
      viewpoint: "sightseeing"
    };

    return categoryMap[category];
  }

  private calculateFinalRecommendationScore(activity: Activity, request: TripRequest, weatherSummary?: WeatherSummary): number {
    const activityScore = this.activityScoringService.calculateActivityScore(activity, request, weatherSummary, request.destination);
    const qualityScore = this.getQualityScore(activity);
    const budgetScore = activity.estimatedCostPerPerson <= request.budgetTotal / Math.max(request.durationDays * request.numberOfPeople, 1) ? 8 : 0;

    return qualityScore + activityScore.interestMatch * 20 + activityScore.weatherMatch * 15 + activityScore.budgetMatch * 10 + budgetScore;
  }

  private pickDiverseActivities<T extends { activity: Activity }>(entries: T[], count: number): T[] {
    const selected: T[] = [];
    const usedCategories = new Set<ActivityCategory>();

    for (const entry of entries) {
      if (selected.length >= count) {
        break;
      }

      if (!usedCategories.has(entry.activity.category)) {
        selected.push(entry);
        usedCategories.add(entry.activity.category);
      }
    }

    for (const entry of entries) {
      if (selected.length >= count) {
        break;
      }

      if (!selected.includes(entry)) {
        selected.push(entry);
      }
    }

    return selected;
  }

  private getQualityScore(activity: Activity): number {
    const qualityTag = activity.tags.find((tag) => tag.startsWith("quality:"));
    const value = qualityTag ? Number(qualityTag.replace("quality:", "")) : Number.NaN;

    return Number.isFinite(value) ? value : 0;
  }

  private durationForCategory(category: PlaceCategory): number {
    const durationByCategory: Record<PlaceCategory, number> = {
      museum: 120,
      landmark: 75,
      park: 90,
      historic_site: 90,
      food: 90,
      shopping: 75,
      viewpoint: 60
    };

    return durationByCategory[category];
  }

  private normalizeIdPart(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
}
