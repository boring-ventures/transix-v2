import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const originId = searchParams.get("originId");
    const destinationId = searchParams.get("destinationId");
    
    if (!query && !originId && !destinationId) {
      return NextResponse.json(
        { error: "At least one search parameter is required" },
        { status: 400 }
      );
    }
    
    const whereClause: any = { active: true };
    
    if (query) {
      whereClause.name = { contains: query, mode: 'insensitive' as const };
    }
    
    if (originId) {
      whereClause.originId = originId;
    }
    
    if (destinationId) {
      whereClause.destinationId = destinationId;
    }
    
    const routes = await prisma.route.findMany({
      where: whereClause,
      include: {
        origin: true,
        destination: true,
      },
      take: limit,
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ routes });
  } catch (error) {
    console.error("Error searching routes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 