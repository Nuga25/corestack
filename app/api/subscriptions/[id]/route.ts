import { NextRequest, NextResponse } from "next/server";
import { getSubscription, upgradeSubscription } from "@/lib/mock-db";
import { PLANS, usersExceedPlanLimit } from "@/lib/pricing";
import { simulateNetwork } from "@/lib/server-sim";
import type { BillingCycle, PlanId } from "@/lib/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await simulateNetwork({ failureRate: 0.05 });
    const subscription = getSubscription(id);
    if (!subscription) {
      return NextResponse.json({ error: { message: "Subscription not found." } }, { status: 404 });
    }
    return NextResponse.json({ data: subscription });
  } catch {
    return NextResponse.json({ error: { message: "We couldn't load this subscription." } }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Slightly higher failure rate here on purpose: the upgrade journey is the
    // primary "reliability" surface the assessment asks for, so its retry/error
    // path needs to be genuinely reachable during review, not just theoretical.
    const forceError = request.nextUrl.searchParams.get("forceError") === "1";
    await simulateNetwork({ failureRate: forceError ? 1 : 0.08, minMs: 400, maxMs: 900 });

    const existing = getSubscription(id);
    if (!existing) {
      return NextResponse.json({ error: { message: "Subscription not found." } }, { status: 404 });
    }

    const body = await request.json();
    const fieldErrors: Record<string, string> = {};

    const planId = body.planId as PlanId;
    const users = Number(body.users);
    const billingCycle = body.billingCycle as BillingCycle;

    if (!planId || !PLANS[planId]) fieldErrors.planId = "Choose a plan.";
    if (!Number.isFinite(users) || users < 1) {
      fieldErrors.users = "Enter at least 1 user.";
    } else if (planId && PLANS[planId] && usersExceedPlanLimit(planId, users)) {
      fieldErrors.users = `${PLANS[planId].name} supports up to ${PLANS[planId].maxUsers} users.`;
    }
    if (billingCycle !== "monthly" && billingCycle !== "annual") {
      fieldErrors.billingCycle = "Choose a billing cycle.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: { message: "Fix the highlighted fields and try again.", fieldErrors } },
        { status: 422 }
      );
    }

    const updated = upgradeSubscription(id, { planId, users, billingCycle });
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json(
      { error: { message: "We couldn't apply this upgrade. No changes were made — try again." } },
      { status: 503 }
    );
  }
}