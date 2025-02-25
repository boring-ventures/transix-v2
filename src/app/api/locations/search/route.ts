import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }
    
    const whereClause = {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { city: { contains: query, mode: 'insensitive' as const } },
      ],
      active: true,
    };
    
    const locations = await prisma.location.findMany({
      where: whereClause,
      take: limit,
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error searching locations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 