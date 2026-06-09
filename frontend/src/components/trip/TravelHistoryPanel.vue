<template>
  <section class="panel travel-history-panel">
    <div class="panel-header">
      <div>
        <h2>Reisehistorie</h2>
        <p>{{ savedTrips.length }} lokal gespeicherte Reisen</p>
      </div>
      <button v-if="savedTrips.length > 0" type="button" class="ghost-button" @click="tripStore.clearSavedTrips()">
        Alle löschen
      </button>
    </div>

    <p v-if="savedTrips.length === 0" class="empty-state">Keine gespeicherten Reisen vorhanden.</p>

    <ol v-else class="history-list">
      <li v-for="trip in savedTrips" :key="trip.tripId" class="history-item">
        <div class="history-meta">
          <strong>{{ trip.destination }}</strong>
          <span>{{ formatDate(trip.createdAt) }}</span>
          <small>{{ trip.durationDays }} Tage · {{ formatCurrency(trip.budget) }}</small>
        </div>
        <div class="history-actions">
          <button type="button" @click="tripStore.loadSavedTrip(trip.tripId)">Laden</button>
          <button type="button" class="secondary" @click="tripStore.deleteSavedTrip(trip.tripId)">Löschen</button>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useTripStore } from "@/stores/trip.store";

const tripStore = useTripStore();
const { savedTrips } = storeToRefs(tripStore);

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}
</script>

<style scoped>
.travel-history-panel {
  display: grid;
  gap: var(--space-3);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.panel-header h2,
.panel-header p {
  margin: 0;
}

.panel-header p {
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.history-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.history-item {
  display: grid;
  gap: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-3);
}

.history-item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.history-meta {
  display: grid;
  gap: var(--space-1);
}

.history-meta span,
.history-meta small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.history-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

button {
  border: 0;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  color: white;
  background: var(--color-primary);
  font-size: var(--font-size-button);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

button.secondary,
button.ghost-button {
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

button.ghost-button {
  white-space: nowrap;
}
</style>
