import { z } from "zod";

export type SignUpFormData = {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
};

export const signUpFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  fullName: z.string().min(1, { message: "Please enter your full name" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignUpFormProps = React.HTMLAttributes<HTMLDivElement>;
