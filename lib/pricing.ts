import type { BillingCycle, Plan, PlanId } from "./types";

export const ANNUAL_DISCOUNT = 0.17; // ~2 months free

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    pricePerUserMonthly: 5000,
    maxUsers: 10,
    features: ["Core workspace tools", "Community support"],
  },
  growth: {
    id: "growth",
    name: "Growth",
    pricePerUserMonthly: 12000,
    maxUsers: 100,
    features: ["Everything in Starter", "Integrations", "Priority support"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    pricePerUserMonthly: 25000,
    maxUsers: null,
    features: ["Everything in Growth", "SSO & SCIM", "Dedicated support"],
  },
};

export const PLAN_ORDER: PlanId[] = ["starter", "growth", "enterprise"];

/** Monthly recurring revenue for a given plan/users/cycle combination. */
export function calculateMrr(planId: PlanId, users: number, billingCycle: BillingCycle): number {
  const plan = PLANS[planId];
  const baseMonthly = plan.pricePerUserMonthly * users;
  if (billingCycle === "annual") {
    return Math.round(baseMonthly * (1 - ANNUAL_DISCOUNT));
  }
  return baseMonthly;
}

/** Total billed amount for a single billing event (monthly charge, or annual upfront charge). */
export function calculateBilledAmount(planId: PlanId, users: number, billingCycle: BillingCycle): number {
  const mrr = calculateMrr(planId, users, billingCycle);
  return billingCycle === "annual" ? mrr * 12 : mrr;
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function usersExceedPlanLimit(planId: PlanId, users: number): boolean {
  const max = PLANS[planId].maxUsers;
  return max !== null && users > max;
}

export function nextBillingDate(startDate: string, billingCycle: BillingCycle): string {
  const start = new Date(startDate);
  const next = new Date(start);
  if (billingCycle === "annual") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString().slice(0, 10);
}