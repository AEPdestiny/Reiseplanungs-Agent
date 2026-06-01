import { Injectable } from "@nestjs/common";
import type { Activity } from "@travel-agent/shared";

export type MockActivity = Omit<Activity, "estimatedCostTotal" | "score">;

export interface BerlinDemoData {
  activities: MockActivity[];
}

const BERLIN_ACTIVITIES: MockActivity[] = [
  {
    id: "museum-island",
    name: "Museumsinsel",
    category: "museum",
    description: "Klassischer Museumsbesuch im historischen Zentrum.",
    location: { name: "Museumsinsel", area: "Mitte" },
    estimatedCostPerPerson: 18,
    durationMinutes: 150,
    indoorOutdoor: "indoor",
    tags: ["museen", "sehenswuerdigkeiten", "geschichte", "rain_safe", "mitte"],
    reasoning: "Passt zu Museumsinteresse und ist wetterunabhaengig.",
    source: "mock"
  },
  {
    id: "brandenburg-gate",
    name: "Brandenburger Tor",
    category: "sightseeing",
    description: "Ikonische Sehenswuerdigkeit und guter Startpunkt fuer Berlin.",
    location: { name: "Brandenburger Tor", area: "Mitte" },
    estimatedCostPerPerson: 0,
    durationMinutes: 45,
    indoorOutdoor: "outdoor",
    tags: ["sehenswuerdigkeiten", "spaziergaenge", "mitte", "outdoor"],
    reasoning: "Kostenloser Klassiker fuer den ersten Berlin-Ueberblick.",
    source: "mock"
  },
  {
    id: "unter-den-linden-walk",
    name: "Spaziergang Unter den Linden",
    category: "walk",
    description: "Entspannter Spaziergang entlang zentraler Berliner Highlights.",
    location: { name: "Unter den Linden", area: "Mitte" },
    estimatedCostPerPerson: 0,
    durationMinutes: 60,
    indoorOutdoor: "outdoor",
    tags: ["spaziergaenge", "sehenswuerdigkeiten", "mitte", "outdoor"],
    reasoning: "Gute Verbindung zwischen mehreren zentralen Orten.",
    source: "mock"
  },
  {
    id: "restaurant-mitte",
    name: "Modernes Berliner Abendessen in Mitte",
    category: "restaurant",
    description: "Gutes, aber budgetbewusstes Abendessen fuer zwei Personen.",
    location: { name: "Restaurant Mitte", area: "Mitte" },
    estimatedCostPerPerson: 34,
    durationMinutes: 90,
    indoorOutdoor: "indoor",
    tags: ["gutes essen", "restaurant", "couple", "mitte", "rain_safe"],
    reasoning: "Erfuellt den Wunsch nach gutem Essen ohne das Budget zu sprengen.",
    source: "mock"
  },
  {
    id: "east-side-gallery",
    name: "East Side Gallery",
    category: "sightseeing",
    description: "Open-Air-Galerie an der Berliner Mauer.",
    location: { name: "East Side Gallery", area: "Friedrichshain" },
    estimatedCostPerPerson: 0,
    durationMinutes: 75,
    indoorOutdoor: "outdoor",
    tags: ["sehenswuerdigkeiten", "spaziergaenge", "kunst", "outdoor", "friedrichshain"],
    reasoning: "Verbindet Sightseeing, Geschichte und Spaziergang.",
    source: "mock"
  },
  {
    id: "tiergarten-walk",
    name: "Spaziergang im Tiergarten",
    category: "walk",
    description: "Gruene Auszeit mit klassischem Berlin-Flair.",
    location: { name: "Tiergarten", area: "Tiergarten" },
    estimatedCostPerPerson: 0,
    durationMinutes: 75,
    indoorOutdoor: "outdoor",
    tags: ["spaziergaenge", "outdoor", "ruhig", "tiergarten"],
    reasoning: "Passt zum Interesse an Spaziergaengen und lockert den Tag auf.",
    source: "mock"
  },
  {
    id: "german-history-museum",
    name: "Deutsches Historisches Museum",
    category: "museum",
    description: "Indoor-Alternative mit starkem Berlin- und Geschichtsbezug.",
    location: { name: "Deutsches Historisches Museum", area: "Mitte" },
    estimatedCostPerPerson: 10,
    durationMinutes: 120,
    indoorOutdoor: "indoor",
    tags: ["museen", "geschichte", "rain_safe", "mitte"],
    reasoning: "Sehr gute Regenalternative in zentraler Lage.",
    source: "mock"
  },
  {
    id: "technology-museum",
    name: "Deutsches Technikmuseum",
    category: "museum",
    description: "Grosses Indoor-Museum mit abwechslungsreichen Ausstellungen.",
    location: { name: "Deutsches Technikmuseum", area: "Kreuzberg" },
    estimatedCostPerPerson: 12,
    durationMinutes: 150,
    indoorOutdoor: "indoor",
    tags: ["museen", "rain_safe", "technik", "kreuzberg"],
    reasoning: "Wettergeeignet und abwechslungsreich fuer einen Regentag.",
    source: "mock"
  },
  {
    id: "markthalle-neun",
    name: "Markthalle Neun",
    category: "restaurant",
    description: "Indoor-Foodspot mit unkomplizierten Optionen.",
    location: { name: "Markthalle Neun", area: "Kreuzberg" },
    estimatedCostPerPerson: 22,
    durationMinutes: 75,
    indoorOutdoor: "indoor",
    tags: ["gutes essen", "restaurant", "rain_safe", "kreuzberg"],
    reasoning: "Gute Indoor-Option fuer Essen und kurze Pause.",
    source: "mock"
  },
  {
    id: "berlinische-galerie",
    name: "Berlinische Galerie",
    category: "museum",
    description: "Museum fuer moderne Kunst, Fotografie und Architektur.",
    location: { name: "Berlinische Galerie", area: "Kreuzberg" },
    estimatedCostPerPerson: 10,
    durationMinutes: 120,
    indoorOutdoor: "indoor",
    tags: ["museen", "kunst", "rain_safe", "kreuzberg"],
    reasoning: "Starke Indoor-Alternative mit lokalem Berlin-Bezug.",
    source: "mock"
  },
  {
    id: "reichstag-dome",
    name: "Reichstagskuppel",
    category: "sightseeing",
    description: "Aussicht und Politikgeschichte an einem zentralen Ort.",
    location: { name: "Reichstag", area: "Mitte" },
    estimatedCostPerPerson: 0,
    durationMinutes: 75,
    indoorOutdoor: "mixed",
    tags: ["sehenswuerdigkeiten", "geschichte", "mitte"],
    reasoning: "Kostenloses Highlight mit guter Planbarkeit.",
    source: "mock"
  },
  {
    id: "cafe-break-mitte",
    name: "Cafe-Pause in Mitte",
    category: "break",
    description: "Kleine Pause mit Kaffee und Kuchen.",
    location: { name: "Cafe Mitte", area: "Mitte" },
    estimatedCostPerPerson: 9,
    durationMinutes: 45,
    indoorOutdoor: "indoor",
    tags: ["cafe", "pause", "gutes essen", "rain_safe", "mitte"],
    reasoning: "Budgetfreundliche Pause zwischen zwei Programmpunkten.",
    source: "mock"
  },
  {
    id: "local-transit-day-ticket",
    name: "Lokale Mobilitaet Tagesanteil",
    category: "transport",
    description: "Geschaetzte Kosten fuer lokale Wege mit dem OPNV.",
    location: { name: "Berlin OPNV", area: "Berlin" },
    estimatedCostPerPerson: 9,
    durationMinutes: 30,
    indoorOutdoor: "mixed",
    tags: ["lokale mobilitaet", "transport", "berlin"],
    reasoning: "Realistische Tageskosten fuer Wege innerhalb Berlins.",
    source: "mock"
  },
  {
    id: "kreuzberg-dinner",
    name: "Abendessen in Kreuzberg",
    category: "restaurant",
    description: "Lebendiges, budgetbewusstes Restaurant fuer den zweiten Abend.",
    location: { name: "Restaurant Kreuzberg", area: "Kreuzberg" },
    estimatedCostPerPerson: 30,
    durationMinutes: 90,
    indoorOutdoor: "indoor",
    tags: ["gutes essen", "restaurant", "couple", "kreuzberg", "rain_safe"],
    reasoning: "Passt zu gutem Essen und liegt nahe mehrerer Indoor-Alternativen.",
    source: "mock"
  },
  {
    id: "charlottenburg-palace",
    name: "Schloss Charlottenburg",
    category: "sightseeing",
    description: "Historische Schlossanlage mit Innen- und Aussenbereichen.",
    location: { name: "Schloss Charlottenburg", area: "Charlottenburg" },
    estimatedCostPerPerson: 14,
    durationMinutes: 120,
    indoorOutdoor: "mixed",
    tags: ["sehenswuerdigkeiten", "geschichte", "charlottenburg"],
    reasoning: "Rundet die Reise mit einem westlichen Berlin-Highlight ab.",
    source: "mock"
  },
  {
    id: "savignyplatz-dinner",
    name: "Abendessen am Savignyplatz",
    category: "restaurant",
    description: "Gemuetlicher Abschluss mit gutem Essen.",
    location: { name: "Savignyplatz", area: "Charlottenburg" },
    estimatedCostPerPerson: 32,
    durationMinutes: 90,
    indoorOutdoor: "indoor",
    tags: ["gutes essen", "restaurant", "couple", "charlottenburg"],
    reasoning: "Angenehmer Abschluss fuer eine Paarreise.",
    source: "mock"
  }
];

@Injectable()
export class MockDataService {
  getBerlinDemoData(): BerlinDemoData {
    return {
      activities: BERLIN_ACTIVITIES.map((activity) => ({ ...activity, location: { ...activity.location } }))
    };
  }

  getActivityById(id: string): MockActivity | undefined {
    const activity = BERLIN_ACTIVITIES.find((item) => item.id === id);
    return activity ? { ...activity, location: { ...activity.location } } : undefined;
  }
}
