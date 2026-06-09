<template>
  <section class="panel export-panel">
    <div class="panel-header">
      <div>
        <h2>Export</h2>
        <p>Reiseplan drucken oder als PDF über den Browser speichern.</p>
      </div>
    </div>

    <button type="button" :disabled="!plan" @click="printTravelPlan">Reiseplan drucken</button>
    <p class="print-hint">Tipp: Im Druckdialog „Als PDF speichern“ auswählen.</p>

    <article v-if="plan" class="print-summary" aria-label="Druckansicht Reiseplan">
      <header>
        <p>Reiseplanungs-Agent</p>
        <h1>{{ plan.request.destination }}</h1>
        <p>
          {{ plan.request.durationDays }} Tage · {{ plan.request.numberOfPeople }} Personen · erstellt am
          {{ formatDate(plan.createdAt) }}
        </p>
      </header>

      <section>
        <h2>Budgetübersicht</h2>
        <p v-if="budget">
          Geplant: {{ formatCurrency(budget.plannedTotal) }} von {{ formatCurrency(budget.budgetTotal) }}.
          Verbleibend: {{ formatCurrency(budget.remaining) }}.
        </p>
      </section>

      <section>
        <h2>Tagesplan</h2>
        <article v-for="day in plan.days" :key="day.dayNumber" class="print-day">
          <h3>Tag {{ day.dayNumber }}: {{ day.title }}</h3>
          <p v-if="day.weather">Wetter: {{ day.weather.description }}</p>
          <ol>
            <li v-for="slot in day.timeSlots" :key="slot.id">
              <strong>{{ slot.startTime }}-{{ slot.endTime }}: {{ slot.activity.name }}</strong>
              <span> · {{ slot.activity.location.name }} · {{ formatCurrency(slot.activity.estimatedCostTotal) }}</span>
              <p>{{ slot.activity.reasoning }}</p>
            </li>
          </ol>
        </article>
      </section>

      <section>
        <h2>Checkliste</h2>
        <ul v-if="checklist?.items.length">
          <li v-for="item in checklist.items" :key="item.id">{{ item.label }} · {{ item.priority }}</li>
        </ul>
        <p v-else>Keine Checkliste vorhanden.</p>
      </section>

      <section>
        <h2>Datenquellen</h2>
        <p>{{ dataSources.length > 0 ? dataSources.join(", ") : "Keine expliziten Quellen im Agentenprotokoll." }}</p>
        <p>Kartenhinweis: Die interaktive Karte wird im Druck ausgelassen. Ortsdaten bleiben im Tagesplan sichtbar.</p>
      </section>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAgentInsightsStore } from "@/stores/agent-insights.store";
import { useBudgetStore } from "@/stores/budget.store";
import { useChecklistStore } from "@/stores/checklist.store";
import { useTripStore } from "@/stores/trip.store";

const { plan } = storeToRefs(useTripStore());
const { budget } = storeToRefs(useBudgetStore());
const { checklist } = storeToRefs(useChecklistStore());
const { agentInsights } = storeToRefs(useAgentInsightsStore());

const dataSources = computed(() => {
  const summaries = agentInsights.value.map((insight) => insight.summary.toLowerCase()).join(" ");
  return ["Nominatim", "Open-Meteo", "Wikidata", "Wikipedia", "OpenTripMap", "OpenStreetMap"].filter((source) =>
    summaries.includes(source.toLowerCase())
  );
});

function printTravelPlan(): void {
  window.print();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}
</script>

<style scoped>
.export-panel {
  display: grid;
  gap: var(--space-3);
}

.panel-header h2,
.panel-header p,
.print-hint {
  margin: 0;
}

.panel-header p,
.print-hint {
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

button {
  border: 0;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  color: white;
  background: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.print-summary {
  display: none;
}

@media print {
  :global(body) {
    background: white;
  }

  :global(.dashboard-header),
  :global(.planning-card),
  :global(.kpi-grid),
  :global(.chat-panel),
  :global(.insights-panel),
  :global(.travel-history-panel),
  :global(.map-panel),
  :global(.replanning-panel),
  :global(.export-panel > :not(.print-summary)) {
    display: none !important;
  }

  :global(.dashboard-shell) {
    padding: 0 !important;
    background: white !important;
  }

  :global(.dashboard-grid),
  :global(.grid-column) {
    display: block !important;
    max-width: none !important;
  }

  :global(.panel) {
    border: 0 !important;
    padding: 0 !important;
    min-height: auto !important;
    box-shadow: none !important;
  }

  .print-summary {
    display: block;
    color: #111827;
    font-size: 11pt;
  }

  .print-summary header,
  .print-summary section,
  .print-day {
    break-inside: avoid;
    margin-bottom: 16pt;
  }

  .print-summary h1 {
    margin: 0 0 6pt;
    font-size: 24pt;
  }

  .print-summary h2 {
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 4pt;
    font-size: 15pt;
  }

  .print-summary h3 {
    font-size: 12pt;
  }

  .print-summary p {
    color: #374151;
  }
}
</style>
