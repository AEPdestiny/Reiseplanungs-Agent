<template>
  <section class="panel insights-panel">
    <h2>Agent Timeline</h2>

    <p v-if="agentInsights.length === 0" class="empty-state">Noch keine Agentenschritte vorhanden.</p>

    <ol v-else class="insight-list" aria-label="Agent Timeline">
      <li v-for="(insight, index) in timelineItems" :key="`${insight.agentName}_${index}`" class="insight-item">
        <div :class="['insight-step', insight.status]">
          <span>{{ index + 1 }}</span>
        </div>
        <div>
          <div class="insight-title">
            <strong>{{ insight.role }}</strong>
            <span :class="['status', insight.status]">{{ insight.status }}</span>
          </div>
          <p class="insight-label">{{ insight.displayLabel }}</p>
          <p>{{ insight.friendlySummary }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAgentInsightsStore } from "@/stores/agent-insights.store";

const { agentInsights } = storeToRefs(useAgentInsightsStore());

const timelineItems = computed(() => {
  return agentInsights.value.map((insight) => ({
    ...insight,
    role: resolveRole(insight.agentName, insight.displayLabel, insight.summary),
    friendlySummary: toFriendlySummary(insight.summary)
  }));
});

function resolveRole(agentName: string, displayLabel: string, summary: string): string {
  const value = `${agentName} ${displayLabel} ${summary}`.toLowerCase();

  if (value.includes("coordinator")) {
    return "Coordinator Agent";
  }

  if (value.includes("geocoding") || value.includes("nominatim")) {
    return "Geocoding Provider";
  }

  if (value.includes("weather") || value.includes("open-meteo")) {
    return "Weather Provider";
  }

  if (value.includes("planning")) {
    return "Planning Agent";
  }

  if (value.includes("places") || value.includes("wikidata")) {
    return "Places Provider";
  }

  if (value.includes("recommendation") || value.includes("score")) {
    return "Recommendation Agent";
  }

  if (value.includes("budget")) {
    return "Budget Agent";
  }

  if (value.includes("checklist")) {
    return "Checklist Agent";
  }

  return displayLabel;
}

function toFriendlySummary(summary: string): string {
  const normalized = summary.toLowerCase();

  if (normalized.includes("weather source: mock fallback")) {
    return "Wetterdaten konnten nicht geladen werden, daher nutzt die App Demo-Wetter.";
  }

  if (normalized.includes("places source: mock fallback")) {
    return "Fuer dieses Ziel wurden Demo-Daten verwendet.";
  }

  if (normalized.includes("places source: wikidata")) {
    return "Ortsdaten stammen aus Wikidata.";
  }

  if (normalized.includes("geocoding source: nominatim")) {
    return "Der Zielort wurde mit Nominatim und OpenStreetMap aufgeloest.";
  }

  if (normalized.includes("geocoding fallback")) {
    return "Die Ortsaufloesung nutzt einen stabilen Demo-Fallback.";
  }

  if (normalized.includes("weather source: open-meteo")) {
    return "Wetterdaten stammen aus Open-Meteo.";
  }

  if (normalized.includes("recommendation score")) {
    return "Empfehlungen wurden nach Interessen, Wetter und Eignung bewertet.";
  }

  if (normalized.includes("free api plan")) {
    return "Der Planning Agent hat einen kostenlosen Free-API-Plan erstellt.";
  }

  return summary;
}
</script>

<style scoped>
.insights-panel {
  display: grid;
  gap: var(--space-3);
}

.insight-list {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.insight-item {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: var(--space-3);
  position: relative;
  padding-bottom: var(--space-4);
}

.insight-item:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 15px;
  top: 34px;
  bottom: 4px;
  width: 2px;
  background: var(--color-border);
}

.insight-step {
  display: grid;
  place-items: center;
  position: relative;
  z-index: 1;
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-secondary);
  background: var(--color-surface-muted);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
}

.insight-step.completed {
  color: var(--color-success);
  background: var(--color-success-soft);
  border-color: var(--color-success);
}

.insight-step.failed {
  color: var(--color-error);
  background: var(--color-error-soft);
  border-color: var(--color-error);
}

.insight-step.pending,
.insight-step.running {
  color: var(--color-warning);
  background: var(--color-warning-soft);
  border-color: var(--color-warning);
}

.insight-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.insight-item p {
  margin-top: var(--space-1);
  font-size: var(--font-size-meta);
}

.insight-label {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.status {
  border-radius: var(--radius-sm);
  padding: 0 var(--space-2);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
  text-transform: capitalize;
}

.status.completed {
  color: var(--color-success);
  background: var(--color-success-soft);
}

.status.failed {
  color: var(--color-error);
  background: var(--color-error-soft);
}

.status.pending,
.status.running {
  color: var(--color-warning);
  background: var(--color-warning-soft);
}
</style>
