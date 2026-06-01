import { Module } from "@nestjs/common";
import { AgentModule } from "../agent/agent.module";
import { BudgetModule } from "../budget/budget.module";
import { MockDataModule } from "../mock-data/mock-data.module";
import { ProposalModule } from "../proposal/proposal.module";
import { RecommendationModule } from "../recommendation/recommendation.module";
import { WeatherModule } from "../weather/weather.module";
import { DemoTripFactory } from "./demo-trip.factory";
import { TravelController } from "./travel.controller";
import { TravelService } from "./travel.service";

@Module({
  imports: [MockDataModule, RecommendationModule, BudgetModule, WeatherModule, AgentModule, ProposalModule],
  controllers: [TravelController],
  providers: [DemoTripFactory, TravelService],
  exports: [TravelService]
})
export class TravelModule {}
