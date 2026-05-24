import { z } from "zod";

/**
 * User Registration Validation Schema
 */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required." })
      .trim()
      .min(2, "Name must contain at least 2 characters."),
    email: z
      .string({ required_error: "Email is required." })
      .trim()
      .email("Please provide a valid email address."),
    password: z
      .string({ required_error: "Password is required." })
      .min(8, "Password must contain at least 8 characters.")
      .max(16, "Password cannot exceed 16 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/\d/, "Password must contain at least one number.")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.")
  })
});

/**
 * User Login Validation Schema
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required." })
      .trim()
      .email("Please provide a valid email address."),
    password: z
      .string({ required_error: "Password is required." })
      .min(1, "Password cannot be empty.")
  })
});
