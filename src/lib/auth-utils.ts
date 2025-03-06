import { prisma } from "@/lib/prisma";

/**
 * Gets the profile ID associated with a user ID
 * @param userId The Supabase user ID
 * @returns The profile ID or null if not found
 */
export async function getProfileIdFromUserId(
  userId: string
): Promise<string | null> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    return profile?.id || null;
  } catch (error) {
    console.error("Error fetching profile ID:", error);
    return null;
  }
}
