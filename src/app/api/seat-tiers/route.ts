import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Get all seat tiers with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const isActive = searchParams.get("isActive");
    const companyId = searchParams.get("companyId");
    
    const whereClause: Prisma.SeatTierWhereInput = {};
    
    if (name) {
      whereClause.name = { contains: name, mode: 'insensitive' };
    }
    
    if (isActive !== null) {
      whereClause.isActive = isActive === "true";
    }
    
    if (companyId) {
      whereClause.companyId = companyId;
    }
    
    const seatTiers = await prisma.seatTier.findMany({
      where: whereClause,
      include: {
        company: true,
        _count: {
          select: {
            busSeats: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ seatTiers });
  } catch (error) {
    console.error("Error fetching seat tiers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new seat tier
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { name, description, companyId, basePrice, isActive } = json;
    
    if (!name || !companyId || basePrice === undefined) {
      return NextResponse.json(
        { error: "Missing required seat tier information" },
        { status: 400 }
      );
    }
    
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
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
        name,
        description,
        companyId,
        basePrice,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        company: true,
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