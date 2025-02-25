import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Get counts of related entities
    const [
      originRoutesCount,
      destinationRoutesCount,
      activeOriginRoutesCount,
      activeDestinationRoutesCount,
      schedulesAsOriginCount,
      schedulesAsDestinationCount,
    ] = await prisma.$transaction([
      prisma.route.count({ where: { originId: id } }),
      prisma.route.count({ where: { destinationId: id } }),
      prisma.route.count({ where: { originId: id, active: true } }),
      prisma.route.count({ where: { destinationId: id, active: true } }),
      prisma.routeSchedule.count({ 
        where: { 
          route: { originId: id } 
        } 
      }),
      prisma.routeSchedule.count({ 
        where: { 
          route: { destinationId: id } 
        } 
      }),
    ]);

    // Get statistics
    const stats = {
      totalRoutesCount: originRoutesCount + destinationRoutesCount,
      originRoutesCount,
      destinationRoutesCount,
      activeRoutesCount: activeOriginRoutesCount + activeDestinationRoutesCount,
      schedulesCount: schedulesAsOriginCount + schedulesAsDestinationCount,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching location statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 