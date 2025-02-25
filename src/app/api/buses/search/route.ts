import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const companyId = searchParams.get("companyId");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }
    
    const whereClause: Prisma.BusWhereInput = {
      OR: [
        { plateNumber: { contains: query, mode: 'insensitive' } },
      ],
      isActive: true,
    };
    
    if (companyId) {
      whereClause.companyId = companyId;
    }
    
    const buses = await prisma.bus.findMany({
      where: whereClause,
      include: {
        company: true,
        template: true,
      },
      take: limit,
      orderBy: {
        plateNumber: "asc",
      },
    });
    
    return NextResponse.json({ buses });
  } catch (error) {
    console.error("Error searching buses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 