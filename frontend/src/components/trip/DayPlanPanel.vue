<template>
  <section class="panel panel-large day-plan-panel">
    <div class="panel-header">
      <div>
        <h2>Tagesplan</h2>
        <p v-if="plan">{{ plan.days.length }} Tage fuer {{ plan.request.destination }}</p>
      </div>
      <span v-if="plan" class="status-pill">{{ plan.status }}</span>
    </div>

    <p v-if="!plan" class="empty-state">Lade eine Demo-Reise, um den Tagesplan zu sehen.</p>

    <div v-else class="days">
      <article v-for="day in plan.days" :key="day.dayNumber" class="day-card">
        <header class="day-header">
          <div>
            <p class="day-number">Tag {{ day.dayNumber }}</p>
            <h3>{{ day.title }}</h3>
          </div>
          <span v-if="day.weather" class="weather-pill">{{ day.weather.description }}</span>
        </header>

        <ol class="slot-list">
          <li v-for="slot in day.timeSlots" :key="slot.id" class="time-slot">
            <div class="slot-time">
              <strong>{{ slot.startTime }}</strong>
              <span>{{ slot.endTime }}</span>
            </div>
            <div class="activity-card">
              <div class="activity-title-row">
                <h4>{{ slot.activity.name }}</h4>
                <span class="category-pill">{{ formatCategory(slot.activity.category) }}</span>
              </div>
              <p class="location">{{ slot.activity.location.name }}</p>
              <p class="reasoning">{{ slot.activity.reasoning }}</p>
              <div class="activity-meta">
                <span>{{ formatCurrency(slot.activity.estimatedCostTotal) }}</span>
                <span>{{ formatIndoorOutdoor(slot.activity.indoorOutdoor) }}</span>
                <span>{{ slot.activity.durationMinutes }} min</span>
                <span v-if="slot.activity.score">Score {{ slot.activity.score.overallScore }}/100</span>
              </div>
              <p v-if="slot.notes" class="notes">{{ slot.notes }}</p>
            </div>
          </li>
        </ol>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useTripStore } from "@/stores/trip.store";

const { plan } = storeToRefs(useTripStore());

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(amount);
}

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    museum: "Museum",
    restaurant: "Restaurant",
    sightseeing: "Sightseeing",
    walk: "Spaziergang",
    activity: "Aktivitaet",
    transport: "Transport",
    break: "Pause"
  };

  return labels[category] ?? category;
}

function formatIndoorOutdoor(value: string): string {
  const labels: Record<string, string> = {
    indoor: "Indoor",
    outdoor: "Outdoor",
    mixed: "Gemischt"
  };

  return labels[value] ?? value;
}
</script>

<style scoped>
.day-plan-panel {
  display: grid;
  gap: var(--space-4);
}

.panel-header,
.day-header,
.activity-title-row,
.activity-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.panel-header p,
.day-number,
.location,
.reasoning,
.notes {
  margin: 0;
  color: var(--color-text-secondary);
}

.status-pill,
.weather-pill,
.category-pill {
  display: inline-flex;
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  background: var(--color-info-soft);
  color: var(--color-info);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.days {
  display: grid;
  gap: var(--space-4);
}

.day-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: var(--color-surface-muted);
}

.day-card h3,
.activity-card h4 {
  margin: 0;
}

.day-number {
  margin-bottom: var(--space-1);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
}

.slot-list {
  display: grid;
  gap: var(--space-3);
  margin: var(--space-4) 0 0;
  padding: 0;
  list-style: none;
}

.time-slot {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: var(--space-3);
}

.slot-time {
  display: grid;
  align-content: start;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.slot-time strong {
  color: var(--color-text-primary);
}

.activity-card {
  display: grid;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-surface);
}

.activity-meta {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.activity-meta span {
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  background: var(--color-background);
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.notes {
  font-size: var(--font-size-meta);
}

@media (max-width: 640px) {
  .time-slot {
    grid-template-columns: 1fr;
  }

  .panel-header,
  .day-header,
  .activity-title-row {
    flex-direction: column;
  }
}
</style>
