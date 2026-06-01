export type TravelType = "solo" | "couple" | "family" | "group";

export interface TripRequest {
  destination: string;
  startDate?: string;
  endDate?: string;
  durationDays: number;
  budgetTotal: number;
  currency: "EUR";
  numberOfPeople: number;
  travelType: TravelType;
  interests: string[];
}
