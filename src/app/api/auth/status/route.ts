import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the current session
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false, error: "No active session" },
        { status: 200 }
      );
    }

    // Get the user's profile to check their role
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        role: true,
        fullName: true,
        email: true,
        companyId: true,
        branchId: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          authenticated: true,
          user: { id: session.user.id, email: session.user.email },
          profile: null,
          message: "User is authenticated but profile not found",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: { id: session.user.id, email: session.user.email },
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking auth status:", error);
    return NextResponse.json(
      { error: "Server error while checking auth status" },
      { status: 500 }
    );
  }
}
