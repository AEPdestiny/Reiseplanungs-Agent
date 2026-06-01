import { Injectable } from "@nestjs/common";
import type { Activity, ActivityScore, TripRequest, WeatherSummary } from "@travel-agent/shared";

type ActivityScoringInput = Omit<Activity, "estimatedCostTotal" | "score"> &
  Partial<Pick<Activity, "estimatedCostTotal" | "score">>;

@Injectable()
export class ActivityScoringService {
  calculateActivityScore(
    activity: ActivityScoringInput,
    tripRequest: TripRequest,
    weatherSummary?: WeatherSummary,
    preferredArea?: string
  ): ActivityScore {
    const normalizedTags = activity.tags.map((tag) => tag.toLowerCase());
    const normalizedInterests = tripRequest.interests.map((interest) => interest.toLowerCase());
    const matchedInterests = normalizedInterests.filter((interest) =>
      normalizedTags.some((tag) => tag.includes(interest) || interest.includes(tag))
    );

    const interestMatch = normalizedInterests.length === 0 ? 0.5 : matchedInterests.length / normalizedInterests.length;
    const perPersonBudgetShare = tripRequest.budgetTotal / tripRequest.numberOfPeople / Math.max(tripRequest.durationDays, 1);
    const budgetMatch = Math.max(0, Math.min(1, 1 - activity.estimatedCostPerPerson / Math.max(perPersonBudgetShare, 1)));
    const weatherMatch = this.calculateWeatherMatch(activity.indoorOutdoor, weatherSummary);
    const locationMatch = preferredArea
      ? activity.location.area === preferredArea
        ? 1
        : activity.location.area === "Berlin"
          ? 0.7
          : 0.5
      : 0.75;
    const overallScore = Number(
      (interestMatch * 0.35 + budgetMatch * 0.25 + weatherMatch * 0.25 + locationMatch * 0.15).toFixed(2)
    );

    return {
      activityId: activity.id,
      interestMatch: Number(interestMatch.toFixed(2)),
      budgetMatch: Number(budgetMatch.toFixed(2)),
      weatherMatch: Number(weatherMatch.toFixed(2)),
      locationMatch: Number(locationMatch.toFixed(2)),
      overallScore,
      explanation: `${activity.name} passt mit Score ${overallScore} zu Interessen, Budget, Wetter und Lage.`
    };
  }

  private calculateWeatherMatch(activityType: Activity["indoorOutdoor"], weatherSummary?: WeatherSummary): number {
    if (!weatherSummary) {
      return 0.75;
    }

    if (weatherSummary.condition === "rain") {
      if (activityType === "indoor") {
        return 1;
      }

      return activityType === "mixed" ? 0.65 : 0.2;
    }

    return activityType === "outdoor" ? 0.9 : 0.8;
  }
}
