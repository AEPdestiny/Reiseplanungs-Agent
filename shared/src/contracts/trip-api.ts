import type { AgentInsight, AgentTraceEntry } from "../types/agent-insight";
import type { BudgetSummary } from "../types/budget-summary";
import type { Checklist } from "../types/checklist";
import type { ReplanningProposal } from "../types/replanning-proposal";
import type { TravelPlan } from "../types/travel-plan";

export interface TripResponseContract {
  tripId: string;
  message?: string;
  plan?: TravelPlan;
  budget?: BudgetSummary;
  checklist?: Checklist;
  proposal?: ReplanningProposal;
  pendingProposal?: ReplanningProposal | null;
  requiresUserConfirmation?: boolean;
  agentTrace?: AgentTraceEntry[];
  agentInsights?: AgentInsight[];
}
