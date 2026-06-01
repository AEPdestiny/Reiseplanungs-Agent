import { Controller, Get } from "@nestjs/common";
import { BACKEND_STATUSES } from "@travel-agent/shared";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): { status: string } {
    return {
      status: BACKEND_STATUSES.healthy
    };
  }
}
