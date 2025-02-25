import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
// Get all seat tiers for a specific company
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Build where clause
    const whereClause: Prisma.SeatTierWhereInput = { companyId: id };
    if (isActive !== null) whereClause.isActive = isActive === "true";

    // Get seat tiers
    const seatTiers = await prisma.seatTier.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ seatTiers });
  } catch (error) {
    console.error("Error fetching company seat tiers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new seat tier for a specific company
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { name, description, basePrice, isActive } = json;
    
    if (!name || basePrice === undefined) {
      return NextResponse.json(
        { error: "Name and base price are required" },
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
    
    // Create seat tier
    const seatTier = await prisma.seatTier.create({
      data: {
        companyId: id,
        name,
        description,
        basePrice,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    
    return NextResponse.json({ seatTier }, { status: 201 });
  } catch (error) {
    console.error("Error creating seat tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 