import { Injectable } from "@nestjs/common";
import type { PlaceCategory, PlaceResult } from "./places-provider.interface";

@Injectable()
export class PlaceRankingService {
  private readonly maxSelectedPlaces = 24;
  private readonly knownHighlightBoosts: Record<string, number> = {
    colosseum: 34,
    kolosseum: 34,
    pantheon: 32,
    "roman forum": 32,
    "forum romanum": 32,
    "trevi fountain": 30,
    "trevi brunnen": 30,
    "fontana di trevi": 30,
    "vatican museums": 28,
    louvre: 34,
    "musee du louvre": 34,
    "eiffel tower": 34,
    eiffelturm: 34,
    "arc de triomphe": 32,
    "notre dame": 28,
    "musee d orsay": 26,
    "sagrada familia": 34,
    "park guell": 32,
    "casa batllo": 28,
    "casa mila": 26,
    "hagia sophia": 34,
    "aya sofya": 34,
    "blue mosque": 32,
    "blaue moschee": 32,
    "sultan ahmed mosque": 32,
    "topkapi palace": 30,
    "galata tower": 26,
    "brandenburg gate": 30,
    "brandenburger tor": 30,
    reichstag: 28,
    "museum island": 30,
    museumsinsel: 30
  };

  rankPlaces(places: PlaceResult[]): PlaceResult[] {
    const scoredPlaces = places
      .map((place) => ({
        ...place,
        qualityScore: this.calculateQualityScore(place)
      }))
      .sort((left, right) => (right.qualityScore ?? 0) - (left.qualityScore ?? 0) || left.name.localeCompare(right.name));

    return this.applyDiversity(scoredPlaces).slice(0, this.maxSelectedPlaces);
  }

  private calculateQualityScore(place: PlaceResult): number {
    let score = place.qualityScore ?? 35;
    score += this.sourceScore(place);
    score += this.categoryScore(place.category);
    score += this.contentScore(place);
    score += this.knownHighlightScore(place);
    score -= this.lowQualityPenalty(place);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private sourceScore(place: PlaceResult): number {
    if (place.source === "wikidata") {
      return 16;
    }

    if (place.source === "opentripmap") {
      return 14;
    }

    if (place.source === "wikipedia") {
      return 12;
    }

    return 0;
  }

  private categoryScore(category: PlaceCategory): number {
    const scoreByCategory: Record<PlaceCategory, number> = {
      museum: 18,
      landmark: 18,
      historic_site: 17,
      viewpoint: 14,
      park: 12,
      food: 8,
      shopping: 5
    };

    return scoreByCategory[category];
  }

  private contentScore(place: PlaceResult): number {
    let score = 0;
    const text = `${place.name} ${place.description} ${place.tags.join(" ")}`.toLowerCase();

    if (place.description.length > 80 && !place.description.includes("GeoSearch POI")) {
      score += 8;
    }

    if (typeof place.latitude === "number" && typeof place.longitude === "number") {
      score += 4;
    }

    if (text.includes("unesco") || text.includes("world heritage")) {
      score += 12;
    }

    if (text.includes("museum") || text.includes("palace") || text.includes("tower") || text.includes("cathedral")) {
      score += 5;
    }

    if (text.includes("wikipedia") && place.source === "opentripmap") {
      score += 7;
    }

    return score;
  }

  private knownHighlightScore(place: PlaceResult): number {
    const normalized = this.normalize(`${place.name} ${place.description}`);
    let boost = 0;

    for (const [keyword, value] of Object.entries(this.knownHighlightBoosts)) {
      if (normalized.includes(this.normalize(keyword))) {
        boost = Math.max(boost, value);
      }
    }

    return boost;
  }

  private lowQualityPenalty(place: PlaceResult): number {
    const normalized = this.normalize(`${place.name} ${place.description} ${place.tags.join(" ")}`);
    let penalty = 0;

    if (normalized.includes("memorial plaque") || normalized.includes("gedenktafel")) {
      penalty += 24;
    }

    if (normalized.includes("single family house") || normalized.includes("einfamilienhaus")) {
      penalty += 28;
    }

    if (normalized.includes("technical") || normalized.includes("utility") || normalized.includes("infrastructure")) {
      penalty += 18;
    }

    if (normalized.includes("minor") || normalized.includes("klein")) {
      penalty += 8;
    }

    return penalty;
  }

  private applyDiversity(scoredPlaces: PlaceResult[]): PlaceResult[] {
    const selected: PlaceResult[] = [];
    const remaining = [...scoredPlaces];
    const categoryCounts = new Map<PlaceCategory, number>();

    while (remaining.length > 0 && selected.length < this.maxSelectedPlaces) {
      const preferredIndex = remaining.findIndex((place) => (categoryCounts.get(place.category) ?? 0) < 3);
      const index = preferredIndex >= 0 ? preferredIndex : 0;
      const [place] = remaining.splice(index, 1);

      selected.push(place);
      categoryCounts.set(place.category, (categoryCounts.get(place.category) ?? 0) + 1);
    }

    return selected;
  }

  private normalize(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ");
  }
}
