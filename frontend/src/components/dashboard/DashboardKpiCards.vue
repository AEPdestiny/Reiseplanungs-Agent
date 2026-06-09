<template>
  <section class="kpi-grid" aria-label="Reise-Kennzahlen">
    <article v-for="card in cards" :key="card.label" class="kpi-card">
      <span class="kpi-label">{{ card.label }}</span>
      <strong>{{ card.value }}</strong>
      <small>{{ card.detail }}</small>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAgentInsightsStore } from "@/stores/agent-insights.store";
import { useBudgetStore } from "@/stores/budget.store";
import { useTripStore } from "@/stores/trip.store";

const { agentInsights } = storeToRefs(useAgentInsightsStore());
const { budget } = storeToRefs(useBudgetStore());
const { plan } = storeToRefs(useTripStore());

const activityCount = computed(() => {
  return plan.value?.days.reduce((total, day) => total + day.timeSlots.length, 0) ?? 0;
});

const activeSources = computed(() => {
  const sources = new Set<string>();
  const summaries = agentInsights.value.map((insight) => insight.summary.toLowerCase());

  if (summaries.some((summary) => summary.includes("nominatim"))) {
    sources.add("Nominatim");
  }

  if (summaries.some((summary) => summary.includes("open-meteo"))) {
    sources.add("Open-Meteo");
  }

  if (summaries.some((summary) => summary.includes("wikidata"))) {
    sources.add("Wikidata");
  }

  if (plan.value) {
    sources.add("OpenStreetMap");
  }

  return [...sources];
});

const cards = computed(() => [
  {
    label: "Tage",
    value: plan.value ? String(plan.value.days.length) : "-",
    detail: plan.value ? "geplante Reisetage" : "noch keine Reise"
  },
  {
    label: "Aktivitaeten",
    value: plan.value ? String(activityCount.value) : "-",
    detail: "aus dem aktiven Tagesplan"
  },
  {
    label: "Geplantes Budget",
    value: formatCurrency(budget.value?.plannedTotal),
    detail: budget.value ? "Backend-Berechnung" : "wartet auf Plan"
  },
  {
    label: "Verbleibend",
    value: formatCurrency(budget.value?.remaining),
    detail: budget.value ? "Budgetreserve" : "wartet auf Plan"
  },
  {
    label: "Datenquellen aktiv",
    value: plan.value ? String(activeSources.value.length) : "-",
    detail: activeSources.value.length > 0 ? activeSources.value.join(", ") : "Free APIs bereit"
  }
]);

function formatCurrency(value: number | undefined): string {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-3);
  max-width: 1440px;
  margin: 0 auto var(--space-4);
}

.kpi-card {
  display: grid;
  gap: var(--space-1);
  min-height: 112px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: var(--color-surface);
}

.kpi-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.kpi-card strong {
  color: var(--color-text-primary);
  font-size: 1.45rem;
  line-height: 1.1;
}

.kpi-card small {
  color: var(--color-text-secondary);
  line-height: 1.35;
}

@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
