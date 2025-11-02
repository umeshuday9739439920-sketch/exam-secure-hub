import { z } from "zod";

// Exam creation validation
export const examSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  duration: z.number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 minute")
    .max(300, "Duration cannot exceed 300 minutes"),
  total_marks: z.number()
    .int("Total marks must be a whole number")
    .min(1, "Total marks must be at least 1"),
  passing_marks: z.number()
    .int("Passing marks must be a whole number")
    .min(1, "Passing marks must be at least 1"),
}).refine(data => data.passing_marks <= data.total_marks, {
  message: "Passing marks cannot exceed total marks",
  path: ["passing_marks"],
});

// Question validation
export const questionSchema = z.object({
  question_text: z.string()
    .trim()
    .min(1, "Question is required")
    .max(1000, "Question must be less than 1000 characters"),
  option_a: z.string()
    .trim()
    .min(1, "Option A is required")
    .max(500, "Option A must be less than 500 characters"),
  option_b: z.string()
    .trim()
    .min(1, "Option B is required")
    .max(500, "Option B must be less than 500 characters"),
  option_c: z.string()
    .trim()
    .min(1, "Option C is required")
    .max(500, "Option C must be less than 500 characters"),
  option_d: z.string()
    .trim()
    .min(1, "Option D is required")
    .max(500, "Option D must be less than 500 characters"),
  correct_answer: z.enum(["A", "B", "C", "D"], {
    errorMap: () => ({ message: "Please select a correct answer" }),
  }),
  marks: z.number()
    .int("Marks must be a whole number")
    .min(1, "Marks must be at least 1")
    .max(100, "Marks cannot exceed 100"),
});

// Auth validation
export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  full_name: z.string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters"),
});

export const signInSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(1, "Password is required")
    .max(128, "Password must be less than 128 characters"),
});
