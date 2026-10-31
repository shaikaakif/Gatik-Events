import { describe, expect, it } from "vitest";
import { initials, safeNextPath } from "@/lib/utils";
import { nextEventStatuses } from "@/lib/events/utils";
import { resetPasswordSchema, signUpSchema } from "@/lib/validation/auth";

describe("safeNextPath", () => {
  it("allows only internal absolute paths", () => {
    expect(safeNextPath("/events/xplorer/roles")).toBe("/events/xplorer/roles");
    expect(safeNextPath("https://evil.example")).toBe("/events");
    expect(safeNextPath("//evil.example/path")).toBe("/events");
    expect(safeNextPath("/\\evil.example")).toBe("/events");
  });
});

describe("identity helpers", () => {
  it("produces stable two-letter initials", () => {
    expect(initials("Aakif Shaik")).toBe("AS");
    expect(initials(null)).toBe("?");
  });
});

describe("authentication validation", () => {
  it("normalizes email and requires a 12-character password", () => {
    const valid = signUpSchema.parse({ full_name: "Test User", email: " TEST@EXAMPLE.COM ", password: "correct-horse" });
    expect(valid.email).toBe("test@example.com");
    expect(signUpSchema.safeParse({ full_name: "Test User", email: "test@example.com", password: "short" }).success).toBe(false);
  });

  it("requires matching reset passwords and a token", () => {
    expect(resetPasswordSchema.safeParse({ password: "correct-horse", confirm_password: "different-value", token: "x".repeat(32) }).success).toBe(false);
  });
});

describe("event lifecycle", () => {
  it("does not allow archived events to transition", () => {
    expect(nextEventStatuses("archived")).toEqual([]);
    expect(nextEventStatuses("registration_open")).toContain("registration_closed");
  });
});
