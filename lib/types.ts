export type PlanId = "starter" | "growth" | "enterprise";

export type BillingCycle = "monthly" | "annual";

export type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled";

export interface Plan {
  id: PlanId;
  name: string;
  pricePerUserMonthly: number; // in NGN
  maxUsers: number | null; // null = unlimited
  features: string[];
}

export interface Subscription {
  id: string;
  companyName: string;
  contactEmail: string;
  planId: PlanId;
  users: number;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startDate: string; // ISO date
  nextBillingDate: string; // ISO date
  mrr: number; // monthly recurring revenue in NGN, derived at creation/upgrade time
}

export interface SubscriptionSummary {
  totalCompanies: number;
  totalMrr: number;
  statusCounts: Record<SubscriptionStatus, number>;
}

export interface CreateSubscriptionInput {
  companyName: string;
  contactEmail: string;
  planId: PlanId;
  users: number;
  billingCycle: BillingCycle;
  startDate: string;
}

export interface UpgradeSubscriptionInput {
  planId: PlanId;
  users: number;
  billingCycle: BillingCycle;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    fieldErrors?: Record<string, string>;
  };
}