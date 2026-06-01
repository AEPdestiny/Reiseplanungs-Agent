<template>
  <section class="panel insights-panel">
    <h2>Agent Insights</h2>

    <p v-if="agentInsights.length === 0" class="empty-state">Noch keine Agentenschritte vorhanden.</p>

    <ol v-else class="insight-list">
      <li v-for="(insight, index) in agentInsights" :key="`${insight.agentName}_${index}`" class="insight-item">
        <div class="insight-step">{{ index + 1 }}</div>
        <div>
          <div class="insight-title">
            <strong>{{ insight.displayLabel }}</strong>
            <span :class="['status', insight.status]">{{ insight.status }}</span>
          </div>
          <p>{{ insight.summary }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAgentInsightsStore } from "@/stores/agent-insights.store";

const { agentInsights } = storeToRefs(useAgentInsightsStore());
</script>

<style scoped>
.insights-panel {
  display: grid;
  gap: var(--space-3);
}

.insight-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.insight-item {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: var(--space-3);
}

.insight-step {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: white;
  background: var(--color-primary);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
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

.status {
  border-radius: var(--radius-sm);
  padding: 0 var(--space-2);
  background: var(--color-success-soft);
  color: var(--color-success);
  font-size: var(--font-size-meta);
}
</style>
