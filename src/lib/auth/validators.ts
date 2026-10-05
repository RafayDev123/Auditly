import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2).max(140),
  email: z.email().max(320),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.email().max(320),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});
