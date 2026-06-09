import { Injectable } from "@nestjs/common";
import { type AgentInsight, type TravelDay, type Trip } from "@travel-agent/shared";

export interface RuleBasedChatResult {
  message: string;
  intent: string;
}

@Injectable()
export class RuleBasedTripChatService {
  createResponse(trip: Trip, message: string): RuleBasedChatResult {
    const normalizedMessage = this.normalize(message);

    if (this.isBudgetQuestion(normalizedMessage)) {
      return {
        intent: "budget",
        message: this.createBudgetAnswer(trip)
      };
    }

    if (this.isWeatherQuestion(normalizedMessage)) {
      return {
        intent: "weather",
        message: this.createWeatherAnswer(trip)
      };
    }

    if (this.isChecklistQuestion(normalizedMessage)) {
      return {
        intent: "checklist",
        message: this.createChecklistAnswer(trip)
      };
    }

    if (this.isSourcesQuestion(normalizedMessage)) {
      return {
        intent: "sources",
        message: this.createSourcesAnswer(trip)
      };
    }

    if (this.isHighlightsQuestion(normalizedMessage)) {
      return {
        intent: "highlights",
        message: this.createHighlightsAnswer(trip)
      };
    }

    if (this.isWhyQuestion(normalizedMessage)) {
      return {
        intent: "why",
        message: this.createWhyAnswer(trip, message, normalizedMessage)
      };
    }

    const requestedDay = this.detectRequestedDay(normalizedMessage);

    if (requestedDay) {
      return {
        intent: "day_plan",
        message: this.createDayAnswer(trip, requestedDay)
      };
    }

    return {
      intent: "help",
      message: this.createHelpAnswer(trip)
    };
  }

  createInsight(intent: string): AgentInsight {
    return {
      agentName: "RuleBasedTripChatService",
      displayLabel: "Rule-based Chat",
      status: "completed",
      summary: `Kostenlose Chat-Antwort aus aktuellem Trip-Kontext (${intent})`
    };
  }

  private createBudgetAnswer(trip: Trip): string {
    const budget = trip.activePlan?.budgetSummary;

    if (!budget) {
      return "Ich sehe aktuell keine Budgetdaten im aktiven Plan.";
    }

    return [
      `Das geplante Budget fuer ${trip.request.destination} liegt bei ${this.formatCurrency(budget.budgetTotal)}.`,
      `Verplant sind ${this.formatCurrency(budget.plannedTotal)}, uebrig bleiben ${this.formatCurrency(budget.remaining)}.`,
      `Pro Person entspricht das aktuell ${this.formatCurrency(budget.perPersonTotal)}.`
    ].join(" ");
  }

  private createWeatherAnswer(trip: Trip): string {
    const days = trip.activePlan?.days ?? [];
    const weatherLines = days
      .filter((day) => Boolean(day.weather))
      .map((day) => {
        const outdoorHint = day.weather?.affectsOutdoorActivities ? "Outdoor-Aktivitaeten koennen betroffen sein." : "Outdoor-Aktivitaeten wirken unkritisch.";
        return `Tag ${day.dayNumber}: ${day.weather?.description ?? "keine Wetterdaten"} ${outdoorHint}`;
      });

    return weatherLines.length > 0
      ? `Die Wetterlage fuer ${trip.request.destination}: ${weatherLines.join(" ")}`
      : "Ich sehe aktuell keine Wetterdaten im aktiven Plan.";
  }

  private createChecklistAnswer(trip: Trip): string {
    const items = trip.checklist?.items ?? [];

    if (items.length === 0) {
      return "Aktuell ist keine Checkliste hinterlegt.";
    }

    const highPriority = items.filter((item) => item.priority === "high").slice(0, 4);
    const selectedItems = highPriority.length > 0 ? highPriority : items.slice(0, 4);

    return `Auf der Checkliste stehen vor allem: ${selectedItems.map((item) => item.label).join(", ")}. Insgesamt sind ${items.length} Punkte hinterlegt.`;
  }

  private createSourcesAnswer(trip: Trip): string {
    const summaries = trip.agentInsights.map((insight) => insight.summary).join(" ");
    const sources = ["Nominatim", "Open-Meteo", "Wikidata", "Wikipedia", "OpenTripMap", "OpenStreetMap"].filter((source) =>
      summaries.toLowerCase().includes(source.toLowerCase())
    );

    return sources.length > 0
      ? `Fuer diesen Plan wurden diese Datenquellen sichtbar genutzt: ${sources.join(", ")}.`
      : "Ich sehe aktuell keine expliziten Datenquellen im Agentenprotokoll. Der Plan bleibt trotzdem aus den strukturierten Reisedaten erklaerbar.";
  }

  private createHighlightsAnswer(trip: Trip): string {
    const activities = this.getActivities(trip)
      .filter((activity) => activity.category === "sightseeing" || activity.category === "museum" || activity.tags.some((tag) => tag.toLowerCase().includes("quality")))
      .slice(0, 6);

    if (activities.length === 0) {
      return "Ich sehe aktuell keine klar markierten Highlights im Plan.";
    }

    return `Die wichtigsten Highlights im Plan sind: ${activities.map((activity) => activity.name).join(", ")}.`;
  }

  private createWhyAnswer(trip: Trip, originalMessage: string, normalizedMessage: string): string {
    const requestedDay = this.detectRequestedDay(normalizedMessage);
    const matchedActivity = this.findActivityByQuestion(trip, originalMessage);

    if (matchedActivity) {
      return [
        `${matchedActivity.name} wurde geplant, weil es zum Ziel ${trip.request.destination} und zu den Interessen ${trip.request.interests.join(", ")} passt.`,
        matchedActivity.reasoning,
        `Die Aktivitaet ist als ${matchedActivity.indoorOutdoor} eingeordnet, dauert ca. ${matchedActivity.durationMinutes} Minuten und kostet ${this.formatCurrency(matchedActivity.estimatedCostTotal)}.`
      ].join(" ");
    }

    if (requestedDay) {
      const day = trip.activePlan?.days.find((candidate) => candidate.dayNumber === requestedDay);

      if (day) {
        const activities = day.timeSlots.map((slot) => slot.activity.name).join(", ");
        const weather = day.weather ? ` Das Wetter wurde beruecksichtigt: ${day.weather.description}` : "";
        return `Tag ${day.dayNumber} wurde so aufgebaut, damit die Aktivitaeten zeitlich zusammenpassen und zu Interessen, Budget und Wetter passen. Enthalten sind: ${activities}.${weather}`;
      }
    }

    if (normalizedMessage.includes("reihenfolge")) {
      return "Die Reihenfolge orientiert sich an Tagesstruktur, Aktivitaetsdauer, Wettertauglichkeit und einer Mischung aus Highlights, Essen, Pausen und Wegen. Der Chat veraendert die Reihenfolge nicht direkt.";
    }

    return "Die Empfehlungen wurden anhand von Interessen, Wettertauglichkeit, Budget, Kategorie-Mix und vorhandenen Ortsdaten ausgewählt. Ich kann auch zu einer konkreten Aktivitaet erklaeren, warum sie im Plan steht.";
  }

  private createDayAnswer(trip: Trip, dayNumber: number): string {
    const day = trip.activePlan?.days.find((candidate) => candidate.dayNumber === dayNumber);

    if (!day) {
      return `Tag ${dayNumber} liegt ausserhalb der aktuellen Reise. Der Plan hat ${trip.activePlan?.days.length ?? 0} Tage.`;
    }

    return this.formatDay(day);
  }

  private createHelpAnswer(trip: Trip): string {
    const nextActivity = this.getActivities(trip)[0]?.name;
    const nextHint = nextActivity ? ` Die naechste Aktivitaet im Plan ist ${nextActivity}.` : "";

    return [
      `Ich kann dir den aktuellen Plan fuer ${trip.request.destination} erklaeren.`,
      "Frag mich zum Beispiel nach Tag 1, dem Budget, dem Wetter, Highlights, der Checkliste oder den Datenquellen.",
      "Ich veraendere den Plan nicht direkt und nehme keine Buchungen vor.",
      nextHint
    ].join(" ");
  }

  private formatDay(day: TravelDay): string {
    const activities = day.timeSlots.map((slot) => `${slot.startTime}-${slot.endTime}: ${slot.activity.name}`).join("; ");
    const weather = day.weather ? ` Wetter: ${day.weather.description}.` : "";

    return `An Tag ${day.dayNumber} steht "${day.title}" an.${weather} Geplant ist: ${activities}.`;
  }

  private getActivities(trip: Trip) {
    return trip.activePlan?.days.flatMap((day) => day.timeSlots.map((slot) => slot.activity)) ?? [];
  }

  private findActivityByQuestion(trip: Trip, message: string) {
    const normalizedMessage = this.normalize(message);

    return this.getActivities(trip).find((activity) => normalizedMessage.includes(this.normalize(activity.name)));
  }

  private detectRequestedDay(message: string): number | null {
    const explicitMatch = message.match(/tag\s*(\d+)/);

    if (explicitMatch) {
      return Number(explicitMatch[1]);
    }

    if (message.includes("morgen") || message.includes("zweiter tag") || message.includes("2. tag")) {
      return 2;
    }

    if (message.includes("erster tag") || message.includes("1. tag")) {
      return 1;
    }

    if (message.includes("dritter tag") || message.includes("3. tag")) {
      return 3;
    }

    return null;
  }

  private isBudgetQuestion(message: string): boolean {
    return ["budget", "kosten", "uebrig", "übrig", "restbudget", "preis"].some((signal) => message.includes(signal));
  }

  private isWeatherQuestion(message: string): boolean {
    return ["wetter", "regen", "temperatur", "sonne", "sturm", "schnee"].some((signal) => message.includes(signal));
  }

  private isChecklistQuestion(message: string): boolean {
    return ["checkliste", "packen", "todo", "to do", "dokument"].some((signal) => message.includes(signal));
  }

  private isHighlightsQuestion(message: string): boolean {
    return ["highlight", "sehenswurdigkeit", "sehenswuerdigkeit", "top ort", "top-ort", "museum"].some((signal) => message.includes(signal));
  }

  private isSourcesQuestion(message: string): boolean {
    return ["quelle", "daten", "api", "provider"].some((signal) => message.includes(signal));
  }

  private isWhyQuestion(message: string): boolean {
    return ["warum", "wieso", "weshalb", "begrund", "begruend", "empfohlen", "geplant", "reihenfolge"].some((signal) =>
      message.includes(signal)
    );
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR"
    }).format(value);
  }
}
