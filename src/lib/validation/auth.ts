import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.")
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.");

export const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name.").max(120, "Name is too long."),
  email,
  phone: z
    .string()
    .trim()
    .max(24, "Phone number is too long.")
    .optional()
    .transform((value) => value || undefined),
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirm_password: z.string().min(1, "Confirm your password."),
    token: z.string().min(32, "This reset link is invalid."),
  })
  .refine((value) => value.password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });

export const resendVerificationSchema = z.object({ email });

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name.").max(120, "Name is too long."),
  phone: z
    .string()
    .trim()
    .max(24, "Phone number is too long.")
    .optional()
    .transform((value) => value || null),
});

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
