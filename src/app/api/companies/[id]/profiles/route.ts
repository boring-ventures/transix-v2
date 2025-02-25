import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";
// Get all profiles for a specific company
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const active = searchParams.get("active");
    const branchId = searchParams.get("branchId");

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Build where clause
    const whereClause: Prisma.ProfileWhereInput = { companyId: id };
    if (role) whereClause.role = role as Role;
    if (active !== null) whereClause.active = active === "true";
    if (branchId) whereClause.branchId = branchId;

    // Get profiles
    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: {
        branch: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Error fetching company profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 