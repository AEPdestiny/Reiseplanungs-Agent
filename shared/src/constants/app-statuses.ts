export const FRONTEND_STATUSES = {
  idle: "idle",
  loading: "loading",
  planning: "planning",
  replanning: "replanning",
  proposalPending: "proposal_pending",
  success: "success",
  error: "error",
  empty: "empty"
} as const;

export const BACKEND_STATUSES = {
  healthy: "healthy",
  ready: "ready"
} as const;
