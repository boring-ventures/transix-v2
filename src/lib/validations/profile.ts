import * as z from "zod";
import { Role } from "@prisma/client";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Convert Prisma enum to string literal union type for Zod
const roleEnum = z.enum([
  Role.superadmin,
  Role.company_admin, 
  Role.branch_admin, 
  Role.seller
]);

export const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must not be longer than 20 characters" }),
  fullName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name must not be longer than 50 characters" }),
  bio: z
    .string()
    .max(500, { message: "Bio must not be longer than 500 characters" })
    .optional()
    .nullable(),
  avatarUrl: z
    .any()
    .refine((files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, 
      "Max file size is 5MB.")
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    )
    .optional()
    .nullable(),
  birthDate: z.date().optional().nullable(),
  role: roleEnum.optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>; 