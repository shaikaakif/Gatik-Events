import { spawnSync } from "node:child_process";

if (process.env.NEXT_PUBLIC_APP_URL?.includes("g-events.shaikaakif.com")) {
  console.error("Refusing to reset seed data while the configured app URL is production.");
  process.exit(1);
}

if (process.env.ALLOW_LOCAL_DB_RESET !== "1") {
  console.error("Local reset is destructive. Set ALLOW_LOCAL_DB_RESET=1 only for an approved local Supabase database.");
  process.exit(1);
}

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(command, ["exec", "supabase", "db", "reset", "--local"], {
  stdio: "inherit",
  shell: false,
});
process.exit(result.status ?? 1);
