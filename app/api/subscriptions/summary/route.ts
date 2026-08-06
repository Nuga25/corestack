import { NextRequest, NextResponse } from "next/server";
import { listSubscriptions } from "@/lib/mock-db";
import { simulateNetwork } from "@/lib/server-sim";
import type { SubscriptionStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const forceError = request.nextUrl.searchParams.get("forceError") === "1";
    await simulateNetwork({ failureRate: forceError ? 1 : 0.06 });

    const subs = listSubscriptions();
    const statusCounts: Record<SubscriptionStatus, number> = {
      active: 0,
      trial: 0,
      past_due: 0,
      cancelled: 0,
    };
    let totalMrr = 0;
    for (const s of subs) {
      statusCounts[s.status] += 1;
      totalMrr += s.mrr;
    }

    return NextResponse.json({
      data: { totalCompanies: subs.length, totalMrr, statusCounts },
    });
  } catch {
    return NextResponse.json({ error: { message: "We couldn't load the summary." } }, { status: 503 });
  }
}