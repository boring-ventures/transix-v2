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
    
    const companies = await prisma.company.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        active: true,
      },
      take: limit,
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error searching companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 