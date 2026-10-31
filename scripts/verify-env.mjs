const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "AUTH_SESSION_SECRET",
  "AUTH_JWT_PRIVATE_KEY",
  "AUTH_JWT_KEY_ID",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Environment variable names are present. Secret values were not printed.");
}
