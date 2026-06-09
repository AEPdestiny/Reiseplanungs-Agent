<template>
  <section class="start-state" aria-labelledby="start-state-title">
    <div class="start-copy">
      <p class="eyebrow">Free-First Travel Planning</p>
      <h2 id="start-state-title">Plane deine naechste Reise</h2>
      <p>
        Kostenfreie Reiseplanung mit Open-Meteo, Nominatim, Wikidata und OpenStreetMap. Starte mit der
        Berlin-Demo oder plane direkt ein eigenes Ziel.
      </p>
    </div>

    <ul class="feature-list" aria-label="Demo-Funktionen">
      <li v-for="feature in features" :key="feature.title">
        <strong>{{ feature.title }}</strong>
        <span>{{ feature.description }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    title: "Free APIs",
    description: "Wetter, Geocoding, Places und Karte ohne kostenpflichtige Anbieter."
  },
  {
    title: "Budgetplanung",
    description: "Deterministische Kostenberechnung aus dem Backend."
  },
  {
    title: "Wetterdaten",
    description: "Open-Meteo Daten mit stabilem Demo-Fallback."
  },
  {
    title: "Kartenansicht",
    description: "OpenStreetMap Karte mit Zielort und POI-Markern."
  },
  {
    title: "Replanning",
    description: "Aenderungen bleiben proposal-basiert und brauchen Bestaetigung."
  }
];
</script>

<style scoped>
.start-state {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
  gap: var(--space-5);
  max-width: 1440px;
  margin: 0 auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  background: var(--color-surface);
}

.start-copy h2,
.start-copy p {
  margin: 0;
}

.start-copy h2 {
  font-size: var(--font-size-headline);
  line-height: 1.1;
}

.start-copy p {
  margin-top: var(--space-3);
  max-width: 640px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-list li {
  display: grid;
  gap: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-background);
}

.feature-list strong {
  color: var(--color-text-primary);
}

.feature-list span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
  line-height: 1.45;
}

@media (max-width: 900px) {
  .start-state,
  .feature-list {
    grid-template-columns: 1fr;
  }
}
</style>
