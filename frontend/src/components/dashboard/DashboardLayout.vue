<template>
  <main class="dashboard-shell">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">MVP 1 Demo</p>
        <h1>Reiseplanungs-Agent</h1>
        <p class="subtitle">GenAI-gestuetzte Reiseplanung mit Chat, Tagesplan, Budget und Proposal Flow.</p>
      </div>
      <div class="dashboard-actions">
        <span class="api-status" :class="apiStatus">
          API: {{ apiStatusLabel }}
        </span>
        <button type="button" :disabled="isLoadingDemo" @click="$emit('load-demo')">
          {{ isLoadingDemo ? "Demo wird geladen" : "Demo-Reise laden" }}
        </button>
        <button
          type="button"
          class="secondary"
          :disabled="!hasTrip || isReplanning || hasPendingProposal"
          @click="$emit('simulate-rain')"
        >
          {{ isReplanning ? "Regen wird simuliert" : "Regen an Tag 2 simulieren" }}
        </button>
      </div>
    </header>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <slot name="planning" />

    <section class="dashboard-grid" aria-label="Reiseplanungs-Dashboard">
      <div class="grid-column side-column">
        <slot name="chat" />
        <slot name="agent-insights" />
      </div>

      <div class="grid-column main-column">
        <slot name="replanning" />
        <slot name="day-plan" />
      </div>

      <div class="grid-column side-column">
        <slot name="budget" />
        <slot name="route" />
        <slot name="checklist" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  hasTrip: boolean;
  isLoadingDemo: boolean;
  isReplanning: boolean;
  hasPendingProposal: boolean;
  apiStatus: "checking" | "online" | "offline";
  error: string | null;
}>();

defineEmits<{
  "load-demo": [];
  "simulate-rain": [];
}>();

const apiStatusLabel = computed(() => {
  if (props.apiStatus === "online") {
    return "online";
  }

  if (props.apiStatus === "offline") {
    return "offline";
  }

  return "pruefen";
});
</script>

<style scoped>
.dashboard-shell {
  min-height: 100vh;
  padding: var(--space-6);
  color: var(--color-text-primary);
  background: var(--color-background);
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin: 0 auto var(--space-5);
  max-width: 1440px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: var(--font-size-headline);
  line-height: 1.1;
}

.eyebrow,
.subtitle {
  margin: 0;
  color: var(--color-text-secondary);
}

.eyebrow {
  margin-bottom: var(--space-1);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.subtitle {
  margin-top: var(--space-2);
  max-width: 720px;
}

.dashboard-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.api-status {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-3);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
}

.api-status.online {
  color: var(--color-success);
  background: var(--color-success-soft);
  border-color: transparent;
}

.api-status.offline {
  color: var(--color-error);
  background: var(--color-error-soft);
  border-color: transparent;
}

button {
  border: 0;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  color: white;
  background: var(--color-primary);
  font-size: var(--font-size-button);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

button.secondary {
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.error-banner {
  max-width: 1440px;
  margin: 0 auto var(--space-4);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  color: var(--color-error);
  background: var(--color-error-soft);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(420px, 1.5fr) minmax(280px, 0.9fr);
  gap: var(--space-4);
  align-items: start;
  max-width: 1440px;
  margin: 0 auto;
}

.grid-column {
  display: grid;
  gap: var(--space-4);
}

@media (max-width: 1100px) {
  .dashboard-header {
    flex-direction: column;
  }

  .dashboard-actions {
    justify-content: flex-start;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-shell {
    padding: var(--space-4);
  }

  .dashboard-actions,
  .dashboard-actions button,
  .api-status {
    width: 100%;
  }

  .dashboard-actions button,
  .api-status {
    justify-content: center;
  }
}
</style>
