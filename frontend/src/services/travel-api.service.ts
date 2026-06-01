import type {
  AgentInsight,
  BudgetSummary,
  Checklist,
  ReplanningProposal,
  TravelPlan,
  WeatherEvent
} from "@travel-agent/shared";

export const TRAVEL_API_BASE_PATH = import.meta.env.VITE_TRAVEL_API_BASE_URL ?? "/api";

export interface HealthResponse {
  status: string;
}

export interface TripApiResponse {
  tripId: string;
  message?: string;
  plan?: TravelPlan;
  budget?: BudgetSummary;
  checklist?: Checklist;
  proposal?: ReplanningProposal;
  pendingProposal?: ReplanningProposal | null;
  requiresUserConfirmation?: boolean;
  agentInsights?: AgentInsight[];
}

export interface ChatApiResponse {
  message: string;
  plan?: TravelPlan;
  proposal?: ReplanningProposal | null;
  requiresUserConfirmation?: boolean;
  agentInsights?: AgentInsight[];
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${TRAVEL_API_BASE_PATH}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json() as Promise<T>;
}

async function readApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? `API-Fehler ${response.status}`;
  } catch {
    return `API-Fehler ${response.status}`;
  }
}

export function healthCheck(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/health");
}

export function loadDemoTrip(): Promise<TripApiResponse> {
  return requestJson<TripApiResponse>("/trips/demo", {
    method: "POST"
  });
}

export function getTrip(tripId: string): Promise<TripApiResponse> {
  return requestJson<TripApiResponse>(`/trips/${tripId}`);
}

export function sendChatMessage(tripId: string, message: string): Promise<ChatApiResponse> {
  return requestJson<ChatApiResponse>(`/trips/${tripId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
}

export function simulateWeather(tripId: string, weatherEvent: WeatherEvent): Promise<TripApiResponse> {
  return requestJson<TripApiResponse>(`/trips/${tripId}/simulate-weather`, {
    method: "POST",
    body: JSON.stringify(weatherEvent)
  });
}

export function acceptProposal(tripId: string, proposalId: string): Promise<TripApiResponse> {
  return requestJson<TripApiResponse>(`/trips/${tripId}/proposals/${proposalId}/accept`, {
    method: "POST"
  });
}

export function rejectProposal(tripId: string, proposalId: string): Promise<TripApiResponse> {
  return requestJson<TripApiResponse>(`/trips/${tripId}/proposals/${proposalId}/reject`, {
    method: "POST"
  });
}
