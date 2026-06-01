<template>
  <section class="panel route-panel">
    <h2>Karte / Route</h2>

    <p v-if="routeStops.length === 0" class="empty-state">Noch keine Orte fuer die Route geladen.</p>

    <ol v-else class="route-list">
      <li v-for="stop in routeStops" :key="stop.id" class="route-stop">
        <span class="route-index">{{ stop.index }}</span>
        <div>
          <strong>{{ stop.name }}</strong>
          <p>Tag {{ stop.dayNumber }} · {{ stop.time }} · {{ stop.area }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useTripStore } from "@/stores/trip.store";

const { plan } = storeToRefs(useTripStore());

const routeStops = computed(() => {
  if (!plan.value) {
    return [];
  }

  return plan.value.days.flatMap((day) =>
    day.timeSlots.map((slot, slotIndex) => ({
      id: slot.id,
      index: slotIndex + 1,
      dayNumber: day.dayNumber,
      time: slot.startTime,
      name: slot.activity.location.name,
      area: slot.activity.location.area ?? slot.activity.location.address ?? "Berlin"
    }))
  );
});
</script>

<style scoped>
.route-panel,
.route-list {
  display: grid;
  gap: var(--space-3);
}

.route-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.route-stop {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: var(--space-3);
  align-items: start;
}

.route-index {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: white;
  background: var(--color-secondary);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
}

.route-stop p {
  margin-top: var(--space-1);
  font-size: var(--font-size-meta);
}
</style>
