import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Create a new location
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { name, active } = json;

    const location = await prisma.location.create({
      data: {
        name,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all locations with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const active = searchParams.get("active");
    
    const whereClause: Prisma.LocationWhereInput = {};
    
    if (name) {
      whereClause.name = { contains: name, mode: 'insensitive' };
    }
    
    if (active !== null) {
      whereClause.active = active === "true";
    }
    
    const locations = await prisma.location.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 