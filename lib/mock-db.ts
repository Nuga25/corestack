import { calculateMrr, nextBillingDate } from "./pricing";
import type { BillingCycle, PlanId, Subscription, SubscriptionStatus } from "./types";

// A module-level array acts as our "database" for the lifetime of the server process.
// This is intentional: the brief calls for a mock API, not a persistent store.

function makeSub(
  id: string,
  companyName: string,
  contactEmail: string,
  planId: PlanId,
  users: number,
  billingCycle: BillingCycle,
  status: SubscriptionStatus,
  startDate: string
): Subscription {
  return {
    id,
    companyName,
    contactEmail,
    planId,
    users,
    billingCycle,
    status,
    startDate,
    nextBillingDate: nextBillingDate(startDate, billingCycle),
    mrr: status === "cancelled" ? 0 : calculateMrr(planId, users, billingCycle),
  };
}

let subscriptions: Subscription[] = [
  makeSub("sub_001", "Alaba Freight Co.", "ops@alabafreight.com", "growth", 42, "annual", "active", "2025-11-02"),
  makeSub("sub_002", "Sunbird Fintech", "billing@sunbirdfintech.io", "enterprise", 210, "annual", "active", "2025-06-15"),
  makeSub("sub_003", "Lekki Studio Collective", "hello@lekkistudio.co", "starter", 6, "monthly", "trial", "2026-07-20"),
  makeSub("sub_004", "Nimbus Logistics", "finance@nimbuslogistics.com", "growth", 28, "monthly", "past_due", "2025-09-10"),
  makeSub("sub_005", "Verdant Agro Ltd.", "admin@verdantagro.ng", "starter", 9, "monthly", "active", "2026-01-05"),
  makeSub("sub_006", "Cobalt Health Systems", "it@cobalthealth.org", "enterprise", 340, "annual", "active", "2025-03-22"),
  makeSub("sub_007", "Pivot Analytics", "team@pivotanalytics.dev", "growth", 15, "monthly", "trial", "2026-07-28"),
  makeSub("sub_008", "Marina Legal Partners", "ops@marinalegal.com", "starter", 4, "annual", "cancelled", "2025-05-01"),
  makeSub("sub_009", "Delta Retail Group", "accounts@deltaretail.ng", "growth", 63, "monthly", "active", "2025-12-11"),
  makeSub("sub_010", "Northbank Capital", "ops@northbankcapital.com", "enterprise", 95, "monthly", "past_due", "2025-10-30"),
  makeSub("sub_011", "Ashen Interiors", "studio@asheninteriors.co", "starter", 3, "monthly", "active", "2026-04-14"),
  makeSub("sub_012", "Quaver Music Tech", "hi@quavermusic.io", "growth", 22, "annual", "trial", "2026-07-30"),
  makeSub("sub_013", "Ridgeway Construction", "admin@ridgewayconst.com", "starter", 8, "monthly", "active", "2026-02-18"),
  makeSub("sub_014", "Halcyon Media Group", "billing@halcyonmedia.tv", "enterprise", 150, "annual", "active", "2025-08-09"),
  makeSub("sub_015", "Terra Nova Foods", "ops@terranovafoods.ng", "growth", 34, "monthly", "cancelled", "2025-04-03"),
];

let nextId = subscriptions.length + 1;

export function listSubscriptions(): Subscription[] {
  return subscriptions;
}

export function getSubscription(id: string): Subscription | undefined {
  return subscriptions.find((s) => s.id === id);
}

export function findByEmail(contactEmail: string): Subscription | undefined {
  return subscriptions.find((s) => s.contactEmail.toLowerCase() === contactEmail.toLowerCase());
}

export function createSubscription(input: {
  companyName: string;
  contactEmail: string;
  planId: PlanId;
  users: number;
  billingCycle: BillingCycle;
  startDate: string;
}): Subscription {
  const sub = makeSub(
    `sub_${String(nextId).padStart(3, "0")}`,
    input.companyName,
    input.contactEmail,
    input.planId,
    input.users,
    input.billingCycle,
    "active",
    input.startDate
  );
  nextId += 1;
  subscriptions = [sub, ...subscriptions];
  return sub;
}

export function upgradeSubscription(
  id: string,
  changes: { planId: PlanId; users: number; billingCycle: BillingCycle }
): Subscription | undefined {
  const idx = subscriptions.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  const existing = subscriptions[idx];
  const updated: Subscription = {
    ...existing,
    planId: changes.planId,
    users: changes.users,
    billingCycle: changes.billingCycle,
    mrr: calculateMrr(changes.planId, changes.users, changes.billingCycle),
    nextBillingDate: nextBillingDate(new Date().toISOString().slice(0, 10), changes.billingCycle),
  };
  subscriptions = [...subscriptions.slice(0, idx), updated, ...subscriptions.slice(idx + 1)];
  return updated;
}

/** Reset helper used by tests to keep the mock DB isolated between test files. */
export function __resetForTests(data: Subscription[]) {
  subscriptions = data;
  nextId = data.length + 1;
}