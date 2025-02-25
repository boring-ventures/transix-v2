import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Create a new route
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { name, originId, destinationId, estimatedDuration, departureLane, active } = json;

    // Validate required fields
    if (!name || !originId || !destinationId || !estimatedDuration) {
      return NextResponse.json(
        { error: "Name, origin, destination, and estimated duration are required" },
        { status: 400 }
      );
    }

    // Check if origin and destination exist
    const [origin, destination] = await Promise.all([
      prisma.location.findUnique({ where: { id: originId } }),
      prisma.location.findUnique({ where: { id: destinationId } })
    ]);

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin or destination location not found" },
        { status: 404 }
      );
    }

    // Create the route
    const route = await prisma.route.create({
      data: {
        name,
        originId,
        destinationId,
        estimatedDuration,
        departureLane: departureLane || "",
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json({ route }, { status: 201 });
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all routes with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const originId = searchParams.get("originId");
    const destinationId = searchParams.get("destinationId");
    const active = searchParams.get("active");
    
    const whereClause: Prisma.RouteWhereInput = {};
    
    if (name) {
      whereClause.name = { contains: name, mode: 'insensitive' };
    }
    
    if (originId) {
      whereClause.originId = originId;
    }
    
    if (destinationId) {
      whereClause.destinationId = destinationId;
    }
    
    if (active !== null) {
      whereClause.active = active === "true";
    }
    
    const routes = await prisma.route.findMany({
      where: whereClause,
      include: {
        origin: true,
        destination: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ routes });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 