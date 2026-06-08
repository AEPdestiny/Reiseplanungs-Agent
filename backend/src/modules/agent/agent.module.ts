import { Module } from "@nestjs/common";
import { BudgetAgentService } from "../../agents/budget/budget-agent.service";
import { ChecklistAgentService } from "../../agents/checklist/checklist-agent.service";
import { CoordinatorAgentService } from "../../agents/coordinator/coordinator-agent.service";
import { PlanningAgentService } from "../../agents/planning/planning-agent.service";
import { TripPlanFactory } from "../../agents/planning/trip-plan.factory";
import { RecommendationAgentService } from "../../agents/recommendation/recommendation-agent.service";
import { ReplanningAgentService } from "../../agents/replanning/replanning-agent.service";
import { BudgetModule } from "../budget/budget.module";
import { MockDataModule } from "../mock-data/mock-data.module";
import { OpenAiModule } from "../openai/openai.module";
import { RecommendationModule } from "../recommendation/recommendation.module";
import { WeatherModule } from "../weather/weather.module";
import { AgentOrchestratorService } from "./agent-orchestrator.service";

@Module({
  imports: [MockDataModule, RecommendationModule, BudgetModule, OpenAiModule, WeatherModule],
  providers: [
    AgentOrchestratorService,
    CoordinatorAgentService,
    PlanningAgentService,
    TripPlanFactory,
    RecommendationAgentService,
    BudgetAgentService,
    ReplanningAgentService,
    ChecklistAgentService
  ],
  exports: [AgentOrchestratorService, ReplanningAgentService, PlanningAgentService]
})
export class AgentModule {}
