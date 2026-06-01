export type AgentInsightStatus = "pending" | "running" | "completed" | "failed";

export interface AgentTraceEntry {
  agentName: string;
  action: string;
  summary: string;
  timestamp: string;
}

export interface AgentInsight {
  agentName: string;
  displayLabel: string;
  status: AgentInsightStatus;
  summary: string;
}
