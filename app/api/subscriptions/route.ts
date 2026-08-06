import { NextRequest, NextResponse } from "next/server";
import { createSubscription, findByEmail, listSubscriptions } from "@/lib/mock-db";
import { PLANS, usersExceedPlanLimit } from "@/lib/pricing";
import { simulateNetwork } from "@/lib/server-sim";
import type { BillingCycle, PlanId, SubscriptionStatus } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  try {
    // Pass ?forceError=1 to exercise the dashboard's error/retry state.
    const forceError = request.nextUrl.searchParams.get("forceError") === "1";
    await simulateNetwork({ failureRate: forceError ? 1 : 0.06 });

    const search = request.nextUrl.searchParams.get("search")?.trim().toLowerCase() ?? "";
    const status = request.nextUrl.searchParams.get("status") as SubscriptionStatus | "all" | null;
    const planId = request.nextUrl.searchParams.get("plan") as PlanId | "all" | null;

    let results = listSubscriptions();

    if (search) {
      results = results.filter(
        (s) =>
          s.companyName.toLowerCase().includes(search) || s.contactEmail.toLowerCase().includes(search)
      );
    }
    if (status && status !== "all") {
      results = results.filter((s) => s.status === status);
    }
    if (planId && planId !== "all") {
      results = results.filter((s) => s.planId === planId);
    }

    return NextResponse.json({ data: results });
  } catch {
    return NextResponse.json(
      { error: { message: "We couldn't load subscriptions. Check your connection and try again." } },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await simulateNetwork({ minMs: 400, maxMs: 800 });

    const body = await request.json();
    const fieldErrors: Record<string, string> = {};

    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
    const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim() : "";
    const planId = body.planId as PlanId;
    const users = Number(body.users);
    const billingCycle = body.billingCycle as BillingCycle;
    const startDate = typeof body.startDate === "string" ? body.startDate : "";

    if (!companyName) fieldErrors.companyName = "Enter the company's name.";
    if (!contactEmail) {
      fieldErrors.contactEmail = "Enter a contact email.";
    } else if (!EMAIL_RE.test(contactEmail)) {
      fieldErrors.contactEmail = "Enter a valid email address.";
    }
    if (!planId || !PLANS[planId]) fieldErrors.planId = "Choose a plan.";
    if (!Number.isFinite(users) || users < 1) {
      fieldErrors.users = "Enter at least 1 user.";
    } else if (planId && PLANS[planId] && usersExceedPlanLimit(planId, users)) {
      fieldErrors.users = `${PLANS[planId].name} supports up to ${PLANS[planId].maxUsers} users.`;
    }
    if (billingCycle !== "monthly" && billingCycle !== "annual") {
      fieldErrors.billingCycle = "Choose a billing cycle.";
    }
    if (!startDate) fieldErrors.startDate = "Choose a start date.";

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: { message: "Fix the highlighted fields and try again.", fieldErrors } },
        { status: 422 }
      );
    }

    if (findByEmail(contactEmail)) {
      return NextResponse.json(
        {
          error: {
            message: "A subscription with this contact email already exists.",
            fieldErrors: { contactEmail: "This email is already registered to a company." },
          },
        },
        { status: 409 }
      );
    }

    const subscription = createSubscription({ companyName, contactEmail, planId, users, billingCycle, startDate });
    return NextResponse.json({ data: subscription }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { message: "We couldn't create the subscription. Please try again." } },
      { status: 503 }
    );
  }
}