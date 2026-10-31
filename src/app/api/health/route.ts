import { NextResponse } from "next/server";
import { getPublicSupabaseConfig } from "@/lib/env";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "gatik-events",
      databaseConfigured: Boolean(getPublicSupabaseConfig()),
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
