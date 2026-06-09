<template>
  <section class="panel weather-panel">
    <div class="panel-header">
      <div>
        <h2>Wettervorhersage</h2>
        <p>{{ sourceLabel }}</p>
      </div>
    </div>

    <p v-if="weatherDays.length === 0" class="empty-state">Keine Wetterdaten verfügbar.</p>

    <ol v-else class="weather-list">
      <li v-for="day in weatherDays" :key="day.dayNumber" class="weather-day">
        <div class="weather-main">
          <span class="day-label">Tag {{ day.dayNumber }}</span>
          <strong>{{ day.description }}</strong>
          <small v-if="day.temperatureLabel">{{ day.temperatureLabel }}</small>
        </div>
        <p v-if="day.affectsOutdoorActivities" class="weather-note">
          Outdoor-Aktivitäten können betroffen sein.
        </p>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import type { WeatherCondition, WeatherSummary } from "@travel-agent/shared";
import { useAgentInsightsStore } from "@/stores/agent-insights.store";
import { useTripStore } from "@/stores/trip.store";

type WeatherWithOptionalTemperature = WeatherSummary & {
  temperatureMin?: number;
  temperatureMax?: number;
  minTemperature?: number;
  maxTemperature?: number;
  precipitationProbability?: number;
};

interface WeatherDayViewModel {
  dayNumber: number;
  condition: WeatherCondition;
  description: string;
  affectsOutdoorActivities: boolean;
  temperatureLabel: string | null;
}

const { plan } = storeToRefs(useTripStore());
const { agentInsights } = storeToRefs(useAgentInsightsStore());

const weatherDays = computed<WeatherDayViewModel[]>(() => {
  return (
    plan.value?.days
      .filter((day) => Boolean(day.weather))
      .map((day) => toWeatherDay(day.weather as WeatherWithOptionalTemperature)) ?? []
  );
});

const sourceLabel = computed(() => {
  const summaries = agentInsights.value.map((insight) => insight.summary.toLowerCase()).join(" ");

  if (summaries.includes("open-meteo")) {
    return "via Open-Meteo";
  }

  if (summaries.includes("mock fallback")) {
    return "Demo-Wetter als Fallback";
  }

  return "aus dem Tagesplan";
});

function toWeatherDay(weather: WeatherWithOptionalTemperature): WeatherDayViewModel {
  const parsedTemperature = parseTemperatureRange(weather.description);
  const parsedPrecipitation = parsePrecipitation(weather.description);
  const min = weather.temperatureMin ?? weather.minTemperature ?? parsedTemperature?.min;
  const max = weather.temperatureMax ?? weather.maxTemperature ?? parsedTemperature?.max;
  const precipitation = formatPrecipitation(weather.precipitationProbability, parsedPrecipitation);

  return {
    dayNumber: weather.dayNumber,
    condition: weather.condition,
    description: formatCondition(weather.condition),
    affectsOutdoorActivities: weather.affectsOutdoorActivities,
    temperatureLabel:
      typeof min === "number" && typeof max === "number" ? `${Math.round(min)}-${Math.round(max)} °C${precipitation}` : null
  };
}

function parseTemperatureRange(description: string): { min: number; max: number } | null {
  const match = description.match(/Temperaturen ca\.?\s*(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s*C/i);

  if (!match) {
    return null;
  }

  return {
    min: Number(match[1].replace(",", ".")),
    max: Number(match[2].replace(",", "."))
  };
}

function parsePrecipitation(description: string): number | null {
  const match = description.match(/Niederschlag ca\.?\s*(\d+(?:[.,]\d+)?)\s*mm/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}

function formatPrecipitation(probability: number | undefined, precipitation: number | null): string {
  if (typeof probability === "number") {
    return `, Regenrisiko ${probability}%`;
  }

  if (typeof precipitation === "number") {
    return `, Niederschlag ${precipitation.toFixed(1)} mm`;
  }

  return "";
}

function formatCondition(condition: WeatherCondition): string {
  const labels: Record<WeatherCondition, string> = {
    sunny: "Sonnig",
    cloudy: "Bewölkt",
    rain: "Regen",
    storm: "Sturm",
    snow: "Schnee"
  };

  return labels[condition];
}
</script>

<style scoped>
.weather-panel {
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

.weather-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.weather-day {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-3);
}

.weather-day:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.weather-main {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.day-label,
.weather-main small,
.weather-note {
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.weather-note {
  grid-column: 1 / -1;
  margin: 0;
}
</style>
