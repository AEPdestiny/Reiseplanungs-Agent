<template>
  <section class="panel map-panel">
    <div class="panel-header">
      <div>
        <h2>Karte</h2>
        <p v-if="plan">{{ markerItems.length }} Orte fuer {{ plan.request.destination }}</p>
      </div>
      <span v-if="plan" class="map-source">OpenStreetMap</span>
    </div>

    <p v-if="isLoading" class="empty-state">Karte wird vorbereitet...</p>
    <p v-else-if="!plan" class="empty-state">Plane oder lade eine Reise, um die Karte zu sehen.</p>

    <div v-show="plan && !mapError" ref="mapElement" class="leaflet-map" aria-label="Reisekarte"></div>

    <p v-if="mapError" class="inline-error">{{ mapError }}</p>

    <ol v-if="markerItems.length > 0" class="marker-list">
      <li v-for="marker in markerItems" :key="marker.id">
        <span class="marker-dot"></span>
        <div>
          <strong>{{ marker.name }}</strong>
          <p>{{ marker.category }} · Tag {{ marker.dayNumber }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import L, { type DivIcon, type LatLngExpression, type Map as LeafletMap, type Marker } from "leaflet";
import { storeToRefs } from "pinia";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useTripStore } from "@/stores/trip.store";

interface DestinationCenter {
  lat: number;
  lng: number;
}

interface MarkerItem {
  id: string;
  name: string;
  category: string;
  dayNumber: number;
  lat: number;
  lng: number;
}

const destinationCenters: Record<string, DestinationCenter> = {
  berlin: { lat: 52.52, lng: 13.405 },
  rom: { lat: 41.9028, lng: 12.4964 },
  rome: { lat: 41.9028, lng: 12.4964 },
  paris: { lat: 48.8566, lng: 2.3522 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  istanbul: { lat: 41.0082, lng: 28.9784 }
};

const tripStore = useTripStore();
const { plan, loading, planningLoading } = storeToRefs(tripStore);
const mapElement = ref<HTMLDivElement | null>(null);
const mapError = ref<string | null>(null);
let map: LeafletMap | null = null;
let markers: Marker[] = [];
let tileLayer: L.TileLayer | null = null;

const isLoading = computed(() => loading.value || planningLoading.value);

const destinationCenter = computed<DestinationCenter>(() => {
  const destination = plan.value?.request.destination.trim().toLowerCase() ?? "berlin";
  return destinationCenters[destination] ?? destinationCenters.berlin;
});

const markerItems = computed<MarkerItem[]>(() => {
  if (!plan.value) {
    return [];
  }

  return plan.value.days.flatMap((day) =>
    day.timeSlots
      .filter((slot) => Number.isFinite(slot.activity.location.lat) && Number.isFinite(slot.activity.location.lng))
      .map((slot) => ({
        id: slot.id,
        name: slot.activity.location.name,
        category: slot.activity.category,
        dayNumber: day.dayNumber,
        lat: slot.activity.location.lat as number,
        lng: slot.activity.location.lng as number
      }))
  );
});

const mapCenter = computed<LatLngExpression>(() => {
  const firstMarker = markerItems.value[0];
  return firstMarker ? [firstMarker.lat, firstMarker.lng] : [destinationCenter.value.lat, destinationCenter.value.lng];
});

watch(
  () => [plan.value?.id, markerItems.value.length, isLoading.value] as const,
  async () => {
    if (!plan.value || isLoading.value) {
      return;
    }

    await nextTick();
    renderMap();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  destroyMap();
});

function renderMap(): void {
  if (!mapElement.value || !plan.value) {
    return;
  }

  try {
    mapError.value = null;
    ensureMap();
    renderMarkers();
    fitMapToMarkers();
  } catch {
    mapError.value = "Karte konnte nicht initialisiert werden. Das Dashboard bleibt nutzbar.";
  }
}

function ensureMap(): void {
  if (!mapElement.value) {
    return;
  }

  if (!map) {
    map = L.map(mapElement.value, {
      attributionControl: true,
      scrollWheelZoom: false
    }).setView(mapCenter.value, 12);

    tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);
  }

  map.invalidateSize();
}

function renderMarkers(): void {
  if (!map || !plan.value) {
    return;
  }

  for (const marker of markers) {
    marker.removeFrom(map);
  }

  markers = [];

  const items = markerItems.value.length > 0 ? markerItems.value : [createDestinationMarker()];

  markers = items.map((item) =>
    L.marker([item.lat, item.lng], { icon: createMarkerIcon() })
      .bindPopup(`<strong>${escapeHtml(item.name)}</strong><br>${escapeHtml(item.category)}`)
      .addTo(map as LeafletMap)
  );
}

function fitMapToMarkers(): void {
  if (!map) {
    return;
  }

  if (markers.length === 0) {
    map.setView(mapCenter.value, 12);
    return;
  }

  const bounds = L.latLngBounds(markers.map((marker) => marker.getLatLng()));
  map.fitBounds(bounds.pad(0.2), { maxZoom: 14 });
}

function createDestinationMarker(): MarkerItem {
  return {
    id: "destination",
    name: plan.value?.request.destination ?? "Reiseziel",
    category: "Reiseziel",
    dayNumber: 1,
    lat: destinationCenter.value.lat,
    lng: destinationCenter.value.lng
  };
}

function createMarkerIcon(): DivIcon {
  return L.divIcon({
    className: "map-marker",
    html: '<span class="map-marker-dot"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function destroyMap(): void {
  if (tileLayer) {
    tileLayer.remove();
    tileLayer = null;
  }

  for (const marker of markers) {
    marker.remove();
  }

  markers = [];

  if (map) {
    map.remove();
    map = null;
  }
}
</script>

<style scoped>
.map-panel {
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
}

.map-source {
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  color: var(--color-info);
  background: var(--color-info-soft);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.leaflet-map {
  min-height: 360px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.marker-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.marker-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  background: var(--color-background);
}

.marker-list p {
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.marker-dot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  margin-top: 0.35rem;
  border-radius: 999px;
  background: var(--color-primary);
}

:global(.map-marker) {
  display: grid;
  place-items: center;
}

:global(.map-marker-dot) {
  display: block;
  width: 18px;
  height: 18px;
  border: 3px solid white;
  border-radius: 999px;
  background: var(--color-primary);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
}

@media (max-width: 640px) {
  .panel-header {
    flex-direction: column;
  }

  .leaflet-map {
    min-height: 300px;
  }
}
</style>
