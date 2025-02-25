import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const companyId = searchParams.get("companyId");
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }
    
    const whereClause: Prisma.DriverWhereInput = {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { documentId: { contains: query, mode: "insensitive" } },
        { licenseNumber: { contains: query, mode: "insensitive" } },
      ],
      active: true,
    };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      include: {
        company: true,
      },
      take: limit,
      orderBy: {
        fullName: "asc",
      },
    });
    
    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Error searching drivers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 