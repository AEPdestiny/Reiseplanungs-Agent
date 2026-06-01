import { Injectable } from "@nestjs/common";
import type { Activity, BudgetCategory, BudgetSummary, TravelPlan, TripRequest } from "@travel-agent/shared";

@Injectable()
export class BudgetService {
  calculateForPlan(plan: Omit<TravelPlan, "budgetSummary">): BudgetSummary {
    const activities = plan.days.flatMap((day) => day.timeSlots.map((slot) => slot.activity));
    return this.calculateForActivities(activities, plan.request);
  }

  calculateForActivities(activities: Activity[], request: TripRequest): BudgetSummary {
    const totalsByCategory = new Map<string, number>();

    for (const activity of activities) {
      const amount = activity.estimatedCostPerPerson * request.numberOfPeople;
      totalsByCategory.set(activity.category, (totalsByCategory.get(activity.category) ?? 0) + amount);
    }

    const plannedTotal = Number(
      Array.from(totalsByCategory.values())
        .reduce((sum, amount) => sum + amount, 0)
        .toFixed(2)
    );
    const remaining = Number((request.budgetTotal - plannedTotal).toFixed(2));
    const perPersonTotal = Number((plannedTotal / Math.max(request.numberOfPeople, 1)).toFixed(2));
    const categories: BudgetCategory[] = Array.from(totalsByCategory.entries()).map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentageOfBudget: Number(((amount / Math.max(request.budgetTotal, 1)) * 100).toFixed(2))
    }));

    return {
      budgetTotal: request.budgetTotal,
      plannedTotal,
      remaining,
      currency: request.currency,
      perPersonTotal,
      categories,
      status: plannedTotal > request.budgetTotal ? "over_budget" : plannedTotal >= request.budgetTotal * 0.9 ? "near_limit" : "within_budget"
    };
  }
}
