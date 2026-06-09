import { defineStore } from "pinia";
import { sendChatMessage } from "@/services/travel-api.service";
import { useAgentInsightsStore } from "./agent-insights.store";
import { useBudgetStore } from "./budget.store";
import { useChecklistStore } from "./checklist.store";
import { useProposalStore } from "./proposal.store";
import { useTripStore } from "./trip.store";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => ({
    messages: [],
    loading: false,
    error: null
  }),
  actions: {
    async sendMessage(tripId: string, message: string): Promise<void> {
      const trimmedMessage = message.trim();

      if (!trimmedMessage) {
        return;
      }

      this.messages.push({
        id: `user_${Date.now()}`,
        role: "user",
        content: trimmedMessage
      });
      this.loading = true;
      this.error = null;

      try {
        const response = await sendChatMessage(tripId, trimmedMessage);

        this.messages.push({
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: response.message
        });
        useProposalStore().setPendingProposal(response.proposal ?? null);
        useAgentInsightsStore().setAgentInsights(response.agentInsights);
      } catch (error) {
        const fallbackMessage = createLocalFallbackMessage(trimmedMessage);

        if (fallbackMessage) {
          this.messages.push({
            id: `assistant_local_${Date.now()}`,
            role: "assistant",
            content: fallbackMessage
          });
          this.error = null;
        } else {
          this.error = error instanceof Error ? error.message : "Nachricht konnte nicht gesendet werden.";
        }
      } finally {
        this.loading = false;
      }
    },
    clear(): void {
      this.messages = [];
      this.error = null;
      this.loading = false;
    }
  }
});

function createLocalFallbackMessage(message: string): string | null {
  const tripStore = useTripStore();
  const budgetStore = useBudgetStore();
  const checklistStore = useChecklistStore();
  const agentInsightsStore = useAgentInsightsStore();
  const plan = tripStore.plan;

  if (!plan) {
    return null;
  }

  const normalized = normalize(message);

  if (normalized.includes("budget") || normalized.includes("kosten") || normalized.includes("ubrig")) {
    const budget = budgetStore.budget ?? plan.budgetSummary;
    return `Lokaler Fallback: Fuer ${plan.request.destination} sind ${formatCurrency(budget.plannedTotal)} von ${formatCurrency(
      budget.budgetTotal
    )} geplant. Es bleiben ${formatCurrency(budget.remaining)} uebrig.`;
  }

  if (normalized.includes("wetter") || normalized.includes("regen") || normalized.includes("temperatur")) {
    const weather = plan.days
      .filter((day) => day.weather)
      .map((day) => `Tag ${day.dayNumber}: ${day.weather?.description}`)
      .join(" ");
    return weather ? `Lokaler Fallback: ${weather}` : "Lokaler Fallback: Es sind keine Wetterdaten sichtbar.";
  }

  if (normalized.includes("checkliste") || normalized.includes("packen") || normalized.includes("todo")) {
    const items = checklistStore.checklist?.items.slice(0, 5).map((item) => item.label) ?? [];
    return items.length > 0
      ? `Lokaler Fallback: Auf der Checkliste stehen unter anderem ${items.join(", ")}.`
      : "Lokaler Fallback: Es ist keine Checkliste sichtbar.";
  }

  if (normalized.includes("highlight") || normalized.includes("sehenswurdigkeit") || normalized.includes("top")) {
    const highlights = plan.days.flatMap((day) => day.timeSlots.map((slot) => slot.activity.name)).slice(0, 6);
    return `Lokaler Fallback: Wichtige Stationen im Plan sind ${highlights.join(", ")}.`;
  }

  if (normalized.includes("quelle") || normalized.includes("daten") || normalized.includes("api")) {
    const summaries = agentInsightsStore.agentInsights.map((insight) => insight.summary.toLowerCase()).join(" ");
    const sources = ["Nominatim", "Open-Meteo", "Wikidata", "Wikipedia", "OpenTripMap", "OpenStreetMap"].filter((source) =>
      summaries.includes(source.toLowerCase())
    );
    return sources.length > 0
      ? `Lokaler Fallback: Sichtbare Datenquellen sind ${sources.join(", ")}.`
      : "Lokaler Fallback: Es sind keine expliziten Datenquellen sichtbar.";
  }

  const requestedDay = detectRequestedDay(normalized);

  if (requestedDay) {
    const day = plan.days.find((candidate) => candidate.dayNumber === requestedDay);
    const activities = day?.timeSlots.map((slot) => `${slot.startTime}: ${slot.activity.name}`).join("; ");
    return day ? `Lokaler Fallback: Tag ${day.dayNumber} - ${day.title}. ${activities}.` : null;
  }

  return `Lokaler Fallback: Ich kann den Plan fuer ${plan.request.destination} erklaeren. Frag nach Tag, Budget, Wetter, Highlights, Checkliste oder Datenquellen.`;
}

function detectRequestedDay(message: string): number | null {
  const match = message.match(/tag\s*(\d+)/);

  if (match) {
    return Number(match[1]);
  }

  if (message.includes("morgen") || message.includes("zweiter tag")) {
    return 2;
  }

  return null;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}
