import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase/server";
import type { Role, Profile } from "@prisma/client";

// Get a specific profile by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the user ID from the route parameter
    const { id } = await params;

    // First check if this is a userId (from Supabase) or a profile ID
    let profile: Profile | null = null;

    // Try to find by userId first (most common case)
    profile = await prisma.profile.findUnique({
      where: { userId: id },
      include: {
        company: true,
        branch: true,
      },
    });

    // If not found by userId, try by profile id
    if (!profile) {
      profile = await prisma.profile.findUnique({
        where: { id },
        include: {
          company: true,
          branch: true,
        },
      });
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get Supabase user data to merge with profile
    const { data: userData } = await supabase.auth.admin.getUserById(
      profile.userId
    );

    // Merge the profile with user data from Supabase
    const enrichedProfile = {
      ...profile,
      email: userData?.user?.email || profile.email,
    };

    return NextResponse.json({ profile: enrichedProfile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a profile
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const { fullName, email, role, companyId, branchId, active, avatarUrl } =
      json;

    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Only superadmins can have null companyId
    if (companyId === null && role !== "superadmin" && role !== undefined) {
      return NextResponse.json(
        { error: "Company ID is required for non-superadmin users" },
        { status: 400 }
      );
    }

    // If companyId is provided, check if it exists
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }
    }

    // If branchId is provided, check if it exists and belongs to the company
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
      });

      if (!branch) {
        return NextResponse.json(
          { error: "Branch not found" },
          { status: 404 }
        );
      }

      if (branch.companyId !== (companyId || existingProfile.companyId)) {
        return NextResponse.json(
          { error: "Branch does not belong to the specified company" },
          { status: 400 }
        );
      }
    }

    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: id },
      data: {
        fullName: fullName !== undefined ? fullName : undefined,
        email: email !== undefined ? email : undefined,
        role: role !== undefined ? (role as Role) : undefined,
        companyId: companyId !== undefined ? companyId : undefined,
        branchId: branchId !== undefined ? branchId : undefined,
        active: active !== undefined ? active : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a profile
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Instead of deleting, mark as inactive
    const deactivatedProfile = await prisma.profile.update({
      where: { userId: id },
      data: {
        active: false,
      },
    });

    return NextResponse.json({
      message: "Profile deactivated successfully",
      profile: deactivatedProfile,
    });
  } catch (error) {
    console.error("Error deactivating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
