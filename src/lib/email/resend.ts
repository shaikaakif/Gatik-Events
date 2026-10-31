import "server-only";

import { Resend } from "resend";
import { isEmailConfigured } from "@/lib/env";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendAuthenticationEmail({
  to,
  name,
  actionUrl,
  kind,
}: {
  to: string;
  name: string;
  actionUrl: string;
  kind: "verify" | "reset";
}) {
  if (!isEmailConfigured()) return { sent: false, reason: "email_not_configured" as const };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const isVerification = kind === "verify";
  const subject = isVerification ? "Verify your Gatik Events email" : "Reset your Gatik Events password";
  const heading = isVerification ? "Confirm your email" : "Choose a new password";
  const action = isVerification ? "Verify email" : "Reset password";
  const expiry = isVerification ? "24 hours" : "1 hour";
  const text = `Hello ${name},\n\n${heading}: ${actionUrl}\n\nThis single-use link expires in ${expiry}. If you did not request this, ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#F6F1E8;color:#24211D;padding:32px">
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase">Gatik Events</p>
      <h1 style="font-family:Georgia,serif;font-size:38px;font-weight:400;margin:24px 0 12px">${heading}</h1>
      <p style="line-height:1.65">Hello ${escapeHtml(name)}, use the secure single-use link below to continue.</p>
      <p style="margin:30px 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#E65B45;color:#24211D;border:2px solid #24211D;padding:14px 20px;text-decoration:none;font-weight:700">${action}</a></p>
      <p style="font-size:12px;line-height:1.6;color:#655F56">This link expires in ${expiry}. If you did not request it, ignore this email. Never forward the link.</p>
    </div>`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    text,
    html,
  });
  if (error) return { sent: false, reason: "delivery_failed" as const };
  return { sent: true as const };
}

export async function sendTeamInvitationEmail({
  to,
  teamName,
  eventTitle,
  inviterName,
  inviteUrl,
}: {
  to: string;
  teamName: string;
  eventTitle: string;
  inviterName: string;
  inviteUrl: string;
}) {
  if (!isEmailConfigured()) return { sent: false, reason: "email_not_configured" as const };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subject = `${inviterName} invited you to ${teamName}`;
  const text = `${inviterName} invited you to join ${teamName} for ${eventTitle}.\n\nAccept in Gatik Events: ${inviteUrl}\n\nIf you were not expecting this, ignore the email. Never forward this link.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#202534">
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5B6475">Gatik Events</p>
      <h1 style="font-size:28px;margin:20px 0 8px">Join ${escapeHtml(teamName)}</h1>
      <p style="line-height:1.6;color:#3a4152">${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(teamName)}</strong> for <strong>${escapeHtml(eventTitle)}</strong>.</p>
      <p style="margin:28px 0"><a href="${escapeHtml(inviteUrl)}" style="background:#193E69;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Review invitation</a></p>
      <p style="font-size:12px;color:#5B6475;line-height:1.6">Sign in with the account this email belongs to. This invitation is single-use and expires automatically. If you were not expecting it, ignore this message and do not forward the link.</p>
    </div>`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    text,
    html,
  });
  if (error) return { sent: false, reason: "delivery_failed" as const };
  return { sent: true as const };
}
