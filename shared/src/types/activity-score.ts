export interface ActivityScore {
  activityId: string;
  interestMatch: number;
  budgetMatch: number;
  weatherMatch: number;
  locationMatch: number;
  overallScore: number;
  explanation: string;
}
