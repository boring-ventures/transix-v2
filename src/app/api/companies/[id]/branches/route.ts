import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
// Get all branches for a specific company
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });
    
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause: Prisma.BranchWhereInput = { companyId: id };
    if (active !== null) {
      whereClause.active = active === "true";
    }
    
    // Get branches
    const branches = await prisma.branch.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Error fetching company branches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new branch for a specific company
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const json = await request.json();
    const { name, address, city, active } = json;
    
    if (!name) {
      return NextResponse.json(
        { error: "Branch name is required" },
        { status: 400 }
      );
    }
    
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });
    
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    // Create branch
    const branch = await prisma.branch.create({
      data: {
        companyId: id,
        name,
        address,
        city,
        active: active !== undefined ? active : true,
      },
    });
    
    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 