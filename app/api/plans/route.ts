import { NextResponse } from "next/server";
import { PLANS, PLAN_ORDER } from "@/lib/pricing";

export async function GET() {
  return NextResponse.json({ data: PLAN_ORDER.map((id) => PLANS[id]) });
}