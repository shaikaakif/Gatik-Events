import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/auth/crypto";
import { createAppSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token || token.length < 32) return NextResponse.redirect(new URL("/login?error=link", url.origin));

  try {
    const admin = createSupabaseAdminClient();
    const { data: userId, error } = await admin.rpc("consume_email_verification_token", {
      p_token_hash: hashToken(token),
    });
    if (error || !userId) return NextResponse.redirect(new URL("/login?error=link", url.origin));
    await createAppSession(String(userId));
    return NextResponse.redirect(new URL("/onboarding?verified=1", url.origin));
  } catch {
    return NextResponse.redirect(new URL("/login?error=config", url.origin));
  }
}
