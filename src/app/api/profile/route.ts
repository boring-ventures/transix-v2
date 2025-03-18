import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoleProtection } from "@/lib/api-auth";
import type { Role, Prisma } from "@prisma/client";

const createProfile = async (req: Request) => {
  try {
    const json = await req.json();
    const { fullName, email, userId, companyId, branchId, avatarUrl, role } =
      json;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Profile already exists for this user" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create profile with provided role or default to seller
    const profile = await prisma.profile.create({
      data: {
        userId: userId,
        role: role || "seller", // Use the role from the request or default to "seller"
        active: true,
        fullName: fullName || null,
        email: email || null,
        companyId: companyId || null,
        branchId: branchId || null,
        avatarUrl: avatarUrl || null,
      },
    });

    return new Response(JSON.stringify({ profile }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Only superadmin and company_admin can create profiles
export const POST = withRoleProtection(createProfile, [
  "superadmin",
  "company_admin",
]);

const getProfiles = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const branchId = searchParams.get("branchId");
    const role = searchParams.get("role");
    const active = searchParams.get("active");

    const whereClause: Prisma.ProfileWhereInput = {};

    if (companyId) whereClause.companyId = companyId;
    if (branchId) whereClause.branchId = branchId;
    if (role) whereClause.role = role as Role;
    if (active !== null) whereClause.active = active === "true";

    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: {
        company: true,
        branch: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

// Only superadmin and company_admin can list profiles
export const GET = withRoleProtection(getProfiles, [
  "superadmin",
  "company_admin",
]);
