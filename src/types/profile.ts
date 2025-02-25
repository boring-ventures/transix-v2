import type { Role } from "@prisma/client";

export interface Profile {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  bio: string | null;
  birthDate: Date;
}
