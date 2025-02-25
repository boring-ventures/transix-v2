import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    
    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }
    
    const profiles = await prisma.profile.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        active: true,
      },
      include: {
        company: true,
        branch: true,
      },
      take: limit,
      orderBy: {
        fullName: "asc",
      },
    });
    
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Error searching profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 