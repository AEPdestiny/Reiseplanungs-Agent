import { Injectable } from "@nestjs/common";
import type {
  Activity,
  ActivityCategory,
  IndoorOutdoor,
  TimeSlot,
  TravelDay,
  TripRequest,
  WeatherSummary
} from "@travel-agent/shared";
import {
  ALLOWED_ACTIVITY_CATEGORIES,
  ALLOWED_INDOOR_OUTDOOR_VALUES,
  type NormalizedStructuredPlanResult,
  type RawStructuredPlanActivity,
  type RawStructuredPlanDay,
  type RawStructuredPlanProposal,
  type RawStructuredPlanTimeSlot
} from "./planning.types";

@Injectable()
export class StructuredPlanNormalizer {
  normalize(rawText: string | undefined, request: TripRequest, weather: WeatherSummary[]): NormalizedStructuredPlanResult {
    if (!rawText?.trim()) {
      return {
        isValid: false,
        fallbackReason: "OpenAI-Antwort war leer."
      };
    }

    const proposal = this.parseProposal(rawText);

    if (!proposal) {
      return {
        isValid: false,
        fallbackReason: "OpenAI-Antwort war kein parsebares JSON."
      };
    }

    if (!Array.isArray(proposal.days) || proposal.days.length < request.durationDays) {
      return {
        isValid: false,
        fallbackReason: "OpenAI lieferte zu wenige Reisetage."
      };
    }

    const days: TravelDay[] = [];

    for (let index = 0; index < request.durationDays; index += 1) {
      const rawDay = proposal.days[index] as RawStructuredPlanDay;
      const normalizedDay = this.normalizeDay(rawDay, index + 1, request, weather);

      if (!normalizedDay) {
        return {
          isValid: false,
          fallbackReason: `OpenAI-Tag ${index + 1} war ungueltig.`
        };
      }

      days.push(normalizedDay);
    }

    return {
      days,
      isValid: true
    };
  }

  private parseProposal(rawText: string): RawStructuredPlanProposal | null {
    const trimmed = rawText.trim();
    const jsonText = this.extractJsonObject(trimmed);

    if (!jsonText) {
      return null;
    }

    try {
      const parsed = JSON.parse(jsonText) as RawStructuredPlanProposal;
      return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }

  private extractJsonObject(text: string): string | null {
    if (text.startsWith("{") && text.endsWith("}")) {
      return text;
    }

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    return firstBrace >= 0 && lastBrace > firstBrace ? text.slice(firstBrace, lastBrace + 1) : null;
  }

  private normalizeDay(
    rawDay: RawStructuredPlanDay,
    expectedDayNumber: number,
    request: TripRequest,
    weather: WeatherSummary[]
  ): TravelDay | null {
    if (!rawDay || typeof rawDay !== "object" || !Array.isArray(rawDay.timeSlots) || rawDay.timeSlots.length === 0) {
      return null;
    }

    const timeSlots: TimeSlot[] = [];

    for (let index = 0; index < rawDay.timeSlots.length; index += 1) {
      const normalizedSlot = this.normalizeTimeSlot(
        rawDay.timeSlots[index] as RawStructuredPlanTimeSlot,
        expectedDayNumber,
        index + 1,
        request
      );

      if (!normalizedSlot) {
        return null;
      }

      timeSlots.push(normalizedSlot);
    }

    return {
      dayNumber: expectedDayNumber,
      title: this.asNonEmptyString(rawDay.title) ?? `Tag ${expectedDayNumber} in ${request.destination}`,
      weather: weather.find((item) => item.dayNumber === expectedDayNumber),
      timeSlots
    };
  }

  private normalizeTimeSlot(
    rawSlot: RawStructuredPlanTimeSlot,
    dayNumber: number,
    slotNumber: number,
    request: TripRequest
  ): TimeSlot | null {
    if (!rawSlot || typeof rawSlot !== "object" || !rawSlot.activity) {
      return null;
    }

    const activity = this.normalizeActivity(rawSlot.activity, dayNumber, slotNumber, request);

    if (!activity) {
      return null;
    }

    return {
      id: `openai-day${dayNumber}-slot${slotNumber}`,
      startTime: this.asTimeString(rawSlot.startTime) ?? this.defaultStartTime(slotNumber),
      endTime: this.asTimeString(rawSlot.endTime) ?? this.defaultEndTime(slotNumber),
      activity
    };
  }

  private normalizeActivity(
    rawActivity: RawStructuredPlanActivity,
    dayNumber: number,
    slotNumber: number,
    request: TripRequest
  ): Activity | null {
    const name = this.asNonEmptyString(rawActivity.name);

    if (!name) {
      return null;
    }

    const category = this.normalizeCategory(rawActivity.category);

    if (!category) {
      return null;
    }

    const estimatedCostPerPerson = this.asNonNegativeNumber(rawActivity.estimatedCostPerPerson);
    const durationMinutes = this.asPositiveInteger(rawActivity.durationMinutes);

    if (estimatedCostPerPerson === null || durationMinutes === null) {
      return null;
    }

    const indoorOutdoor = this.normalizeIndoorOutdoor(rawActivity.indoorOutdoor);

    return {
      id: `openai-day${dayNumber}-slot${slotNumber}-${this.slugify(name)}`,
      name,
      category,
      description: this.asNonEmptyString(rawActivity.description) ?? "OpenAI-basierter Planungsvorschlag.",
      location: {
        name: this.asNonEmptyString(rawActivity.location?.name) ?? request.destination,
        area: this.asNonEmptyString(rawActivity.location?.area) ?? request.destination
      },
      estimatedCostPerPerson,
      estimatedCostTotal: Number((estimatedCostPerPerson * request.numberOfPeople).toFixed(2)),
      durationMinutes,
      indoorOutdoor,
      tags: this.normalizeTags(rawActivity.tags, request),
      reasoning:
        this.asNonEmptyString(rawActivity.reasoning) ??
        "Passt zu den angegebenen Interessen und zum gewuenschten Reiseprofil.",
      source: "openai"
    };
  }

  private normalizeCategory(value: unknown): ActivityCategory | null {
    const normalized = this.asNonEmptyString(value)?.toLowerCase();

    if (!normalized) {
      return null;
    }

    const aliases: Record<string, ActivityCategory> = {
      cafe: "break",
      cafepause: "break",
      coffee: "break",
      food: "restaurant",
      essen: "restaurant",
      restaurant: "restaurant",
      museum: "museum",
      museumsbesuch: "museum",
      sehenswuerdigkeit: "sightseeing",
      sightseeing: "sightseeing",
      spaziergang: "walk",
      walk: "walk",
      aktivitaet: "activity",
      activity: "activity",
      transport: "transport",
      mobilitaet: "transport",
      pause: "break",
      break: "break"
    };
    const aliased = aliases[normalized.replace(/[\s_-]/g, "")] ?? aliases[normalized];

    if (aliased) {
      return aliased;
    }

    return ALLOWED_ACTIVITY_CATEGORIES.includes(normalized as ActivityCategory)
      ? (normalized as ActivityCategory)
      : null;
  }

  private normalizeIndoorOutdoor(value: unknown): IndoorOutdoor {
    const normalized = this.asNonEmptyString(value)?.toLowerCase();

    return ALLOWED_INDOOR_OUTDOOR_VALUES.includes(normalized as IndoorOutdoor)
      ? (normalized as IndoorOutdoor)
      : "mixed";
  }

  private normalizeTags(value: unknown, request: TripRequest): string[] {
    const rawTags = Array.isArray(value)
      ? value.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
      : [];
    const tags = rawTags.length > 0 ? rawTags : request.interests;

    return Array.from(new Set(tags.map((tag) => tag.toLowerCase()))).slice(0, 8);
  }

  private asNonEmptyString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  private asNonNegativeNumber(value: unknown): number | null {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return null;
    }

    return Number(value.toFixed(2));
  }

  private asPositiveInteger(value: unknown): number | null {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return null;
    }

    return Math.round(value);
  }

  private asTimeString(value: unknown): string | null {
    const text = this.asNonEmptyString(value);

    return text && /^\d{2}:\d{2}$/.test(text) ? text : null;
  }

  private defaultStartTime(slotNumber: number): string {
    return ["10:00", "12:00", "14:30", "18:30", "20:15"][slotNumber - 1] ?? "10:00";
  }

  private defaultEndTime(slotNumber: number): string {
    return ["11:30", "13:30", "16:00", "20:00", "20:45"][slotNumber - 1] ?? "11:30";
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }
}
