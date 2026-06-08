<template>
  <section class="planning-card" aria-labelledby="planning-form-title">
    <div class="planning-copy">
      <p class="eyebrow">Eigene Reise planen</p>
      <h2 id="planning-form-title">Free-API Reiseplanung</h2>
      <p>
        Ziel, Budget und Interessen eingeben. Das Backend plant mit Geocoding, Wetter, Places und Recommendation Scoring.
      </p>
    </div>

    <form class="planning-form" @submit.prevent="submitForm">
      <label class="field field-wide">
        <span>Destination</span>
        <input v-model.trim="form.destination" type="text" placeholder="Rom, Paris, Istanbul" required />
      </label>

      <label class="field">
        <span>Dauer</span>
        <input v-model.number="form.durationDays" type="number" min="1" max="14" required />
      </label>

      <label class="field">
        <span>Budget</span>
        <input v-model.number="form.budgetTotal" type="number" min="1" step="10" required />
      </label>

      <label class="field">
        <span>Currency</span>
        <input v-model="form.currency" type="text" readonly />
      </label>

      <label class="field">
        <span>Personen</span>
        <input v-model.number="form.numberOfPeople" type="number" min="1" max="20" required />
      </label>

      <label class="field">
        <span>Reisetyp</span>
        <select v-model="form.travelType">
          <option value="solo">Solo</option>
          <option value="couple">Paar</option>
          <option value="family">Familie</option>
          <option value="group">Gruppe</option>
        </select>
      </label>

      <fieldset class="interest-field">
        <legend>Interessen</legend>
        <label v-for="interest in interests" :key="interest.value" class="interest-option">
          <input v-model="form.interests" type="checkbox" :value="interest.value" />
          <span>{{ interest.label }}</span>
        </label>
      </fieldset>

      <p v-if="validationError" class="inline-error field-wide">{{ validationError }}</p>

      <button type="submit" class="submit-button" :disabled="isPlanning" @click.prevent="submitForm">
        <span v-if="isPlanning" class="spinner" aria-hidden="true"></span>
        {{ isPlanning ? "Reise wird geplant..." : "Plan erstellen" }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { TravelType, TripRequest } from "@travel-agent/shared";

defineProps<{
  isPlanning: boolean;
}>();

const emit = defineEmits<{
  submit: [request: TripRequest];
}>();

const interests = [
  { label: "Museen", value: "Museen" },
  { label: "Essen", value: "gutes Essen" },
  { label: "Sehenswuerdigkeiten", value: "Sehenswuerdigkeiten" },
  { label: "Geschichte", value: "Geschichte" },
  { label: "Spaziergaenge", value: "Spaziergaenge" },
  { label: "Natur", value: "Natur" },
  { label: "Shopping", value: "Shopping" }
];

const form = reactive<TripRequest>({
  destination: "Rom",
  durationDays: 3,
  budgetTotal: 600,
  currency: "EUR",
  numberOfPeople: 2,
  travelType: "couple" satisfies TravelType,
  interests: ["Museen", "gutes Essen", "Sehenswuerdigkeiten"]
});
const validationError = ref<string | null>(null);

function submitForm(): void {
  validationError.value = null;

  if (!form.destination.trim()) {
    validationError.value = "Bitte ein Reiseziel eingeben.";
    return;
  }

  if (form.interests.length === 0) {
    validationError.value = "Bitte mindestens ein Interesse auswaehlen.";
    return;
  }

  emit("submit", {
    ...form,
    destination: form.destination.trim(),
    interests: [...form.interests]
  });
}
</script>

<style scoped>
.planning-card {
  display: grid;
  grid-template-columns: minmax(220px, 0.45fr) minmax(0, 1fr);
  gap: var(--space-5);
  max-width: 1440px;
  margin: 0 auto var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: var(--color-surface);
}

.planning-copy h2,
.planning-copy p {
  margin: 0;
}

.planning-copy h2 {
  font-size: var(--font-size-section-title);
}

.planning-copy p {
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
}

.eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.planning-form {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--space-3);
  align-items: end;
}

.field {
  display: grid;
  gap: var(--space-1);
  grid-column: span 2;
  min-width: 0;
}

.field-wide {
  grid-column: span 3;
}

.field span,
.interest-field legend {
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
}

input,
select {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-3);
  color: var(--color-text-primary);
  background: var(--color-background);
}

input[readonly] {
  color: var(--color-text-secondary);
}

.interest-field {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  grid-column: 1 / -1;
  min-width: 0;
  border: 0;
  margin: 0;
  padding: 0;
}

.interest-option {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  background: var(--color-background);
  color: var(--color-text-primary);
  cursor: pointer;
}

.interest-option input {
  width: auto;
  min-height: auto;
}

.submit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  grid-column: span 2;
  min-height: 40px;
  border: 0;
  border-radius: var(--radius-md);
  padding: 0 var(--space-4);
  color: white;
  background: var(--color-primary);
  font-size: var(--font-size-button);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: white;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .planning-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .planning-form {
    grid-template-columns: 1fr;
  }

  .field,
  .field-wide,
  .submit-button {
    grid-column: 1 / -1;
  }
}
</style>
