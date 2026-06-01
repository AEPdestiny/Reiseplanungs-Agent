import { Module } from "@nestjs/common";
import { ActivityScoringService } from "./activity-scoring.service";

@Module({
  providers: [ActivityScoringService],
  exports: [ActivityScoringService]
})
export class RecommendationModule {}
