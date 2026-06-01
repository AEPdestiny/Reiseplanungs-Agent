import { Module } from "@nestjs/common";
import { AgentModule } from "./modules/agent/agent.module";
import { BudgetModule } from "./modules/budget/budget.module";
import { MockDataModule } from "./modules/mock-data/mock-data.module";
import { OpenAiModule } from "./modules/openai/openai.module";
import { ProposalModule } from "./modules/proposal/proposal.module";
import { RecommendationModule } from "./modules/recommendation/recommendation.module";
import { TravelModule } from "./modules/travel/travel.module";
import { WeatherModule } from "./modules/weather/weather.module";
import { HealthController } from "./common/health.controller";

@Module({
  imports: [
    TravelModule,
    AgentModule,
    OpenAiModule,
    MockDataModule,
    WeatherModule,
    BudgetModule,
    RecommendationModule,
    ProposalModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
