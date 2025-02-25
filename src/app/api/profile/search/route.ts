import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const companyId = searchParams.get("companyId");
    const role = searchParams.get("role");
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }
    
    const whereClause: Prisma.ProfileWhereInput = {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
      active: true,
    };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    if (role) {
      whereClause.role = role as Role;
    }

    const profiles = await prisma.profile.findMany({
      where: whereClause,
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