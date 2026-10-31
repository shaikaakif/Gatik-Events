"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, getPublicSupabaseConfig, isEmailConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/utils";
import { createOpaqueToken, hashPassword, hashToken, verifyPassword } from "@/lib/auth/crypto";
import { createAppSession, revokeCurrentSession } from "@/lib/auth/session";
import { enforceAuthRateLimit } from "@/lib/auth/rate-limit";
import { sendAuthenticationEmail } from "@/lib/email/resend";
import {
  fieldErrors,
  firstIssue,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/validation/auth";
import type { ActionState } from "@/lib/types";
import { requireViewer } from "@/lib/auth/guards";

type AccountRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  email_verified_at: string | null;
  status: "active" | "suspended" | "disabled";
};

function customAuthConfigured() {
  return Boolean(
    getPublicSupabaseConfig() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.AUTH_SESSION_SECRET?.trim() &&
      process.env.AUTH_JWT_PRIVATE_KEY?.trim() &&
      process.env.AUTH_JWT_KEY_ID?.trim(),
  );
}

function configurationError(): ActionState {
  return { status: "error", message: "Account services are not configured for this environment." };
}

async function createAndSendToken(account: Pick<AccountRow, "id" | "email" | "full_name">, kind: "verify" | "reset") {
  const admin = createSupabaseAdminClient();
  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const table = kind === "verify" ? "email_verification_tokens" : "password_reset_tokens";
  const expiryHours = kind === "verify" ? 24 : 1;
  await admin.from(table).update({ consumed_at: new Date().toISOString() }).eq("user_id", account.id).is("consumed_at", null);
  const { error } = await admin.from(table).insert({
    user_id: account.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
  });
  if (error) return false;
  const path = kind === "verify" ? `/auth/verify?token=${encodeURIComponent(token)}` : `/reset-password?token=${encodeURIComponent(token)}`;
  const result = await sendAuthenticationEmail({
    to: account.email,
    name: account.full_name,
    actionUrl: `${getAppUrl()}${path}`,
    kind,
  });
  return result.sent;
}

export async function signUpAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!customAuthConfigured() || !isEmailConfigured()) return configurationError();
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  if (!(await enforceAuthRateLimit("signup", parsed.data.email, 5, 30))) {
    return { status: "error", message: "Too many attempts. Please wait before trying again." };
  }

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("app_users")
    .select("id, email, password_hash, full_name, email_verified_at, status")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (!existing) {
    const passwordHash = await hashPassword(parsed.data.password);
    const { data: created, error } = await admin
      .from("app_users")
      .insert({
        email: parsed.data.email,
        password_hash: passwordHash,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone ?? null,
      })
      .select("id, email, password_hash, full_name, email_verified_at, status")
      .single();
    if (error || !created) return { status: "error", message: "Account creation could not be completed." };
    await createAndSendToken(created as AccountRow, "verify");
  }

  redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!customAuthConfigured()) return configurationError();
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  if (!(await enforceAuthRateLimit("login", parsed.data.email, 8, 15))) {
    return { status: "error", message: "Too many attempts. Please wait before trying again." };
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("app_users")
    .select("id, email, password_hash, full_name, email_verified_at, status")
    .eq("email", parsed.data.email)
    .maybeSingle();
  const account = data as AccountRow | null;
  const valid = account ? await verifyPassword(account.password_hash, parsed.data.password) : false;
  if (!account || !valid || account.status !== "active" || !account.email_verified_at) {
    await admin.from("auth_audit_logs").insert({ user_id: account?.id ?? null, action: "login", result: "denied" });
    return { status: "error", message: "Unable to sign in. Check your credentials and email verification." };
  }

  await createAppSession(account.id);
  await admin.from("auth_audit_logs").insert({ user_id: account.id, action: "login", result: "success" });
  redirect(safeNextPath(parsed.data.next));
}

export async function forgotPasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!customAuthConfigured() || !isEmailConfigured()) return configurationError();
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  const allowed = await enforceAuthRateLimit("password_reset", parsed.data.email, 4, 30);
  if (allowed) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("app_users").select("id, email, full_name").eq("email", parsed.data.email).eq("status", "active").maybeSingle();
    if (data) await createAndSendToken(data as AccountRow, "reset");
  }
  return { status: "success", message: "If an eligible account exists, password-reset instructions have been requested." };
}

export async function resetPasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!customAuthConfigured()) return configurationError();
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  const passwordHash = await hashPassword(parsed.data.password);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("consume_password_reset_token", {
    p_token_hash: hashToken(parsed.data.token),
    p_password_hash: passwordHash,
  });
  if (error || !data) return { status: "error", message: "This reset link is invalid or has expired." };
  redirect("/login?reset=1");
}

export async function resendVerificationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!customAuthConfigured() || !isEmailConfigured()) return configurationError();
  const parsed = resendVerificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };
  const allowed = await enforceAuthRateLimit("verification", parsed.data.email, 4, 30);
  if (allowed) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("app_users").select("id, email, full_name").eq("email", parsed.data.email).is("email_verified_at", null).eq("status", "active").maybeSingle();
    if (data) await createAndSendToken(data as AccountRow, "verify");
  }
  return { status: "success", message: "If verification is pending, a fresh link has been requested." };
}

export async function updateProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!customAuthConfigured()) return configurationError();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error), fieldErrors: fieldErrors(parsed.error) };
  const viewer = await requireViewer("/onboarding");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name, phone: parsed.data.phone }).eq("id", viewer.id);
  if (error) return { status: "error", message: "Your profile could not be updated." };
  const admin = createSupabaseAdminClient();
  await admin.from("app_users").update({ full_name: parsed.data.full_name, phone: parsed.data.phone, updated_at: new Date().toISOString() }).eq("id", viewer.id);
  revalidatePath("/onboarding");
  revalidatePath("/profile");
  revalidatePath("/events");
  return { status: "success", message: "Profile updated." };
}

export async function signOutAction() {
  await revokeCurrentSession();
  redirect("/");
}
