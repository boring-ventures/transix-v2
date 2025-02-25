import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("routeId");
    const active = searchParams.get("active");

    // Build where clause
    const whereClause = {
      ...(routeId ? { routeId } : {}),
      ...(active !== null ? { active: active === "true" } : {}),
    };

    const routeSchedules = await prisma.routeSchedule.findMany({
      where: whereClause,
      include: {
        route: {
          include: {
            origin: true,
            destination: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({ routeSchedules });
  } catch (error) {
    console.error("Error fetching route schedules:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      routeId,
      operatingDays,
      departureTime,
      estimatedArrivalTime,
      seasonStart,
      seasonEnd,
      active = true,
    } = data;

    // Validate required fields
    if (!routeId) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 }
      );
    }

    if (!operatingDays) {
      return NextResponse.json(
        { error: "Operating days are required" },
        { status: 400 }
      );
    }

    if (!departureTime) {
      return NextResponse.json(
        { error: "Departure time is required" },
        { status: 400 }
      );
    }

    if (!estimatedArrivalTime) {
      return NextResponse.json(
        { error: "Estimated arrival time is required" },
        { status: 400 }
      );
    }

    // Create route schedule
    const routeSchedule = await prisma.routeSchedule.create({
      data: {
        routeId,
        operatingDays,
        departureTime: new Date(`2000-01-01T${departureTime}`),
        estimatedArrivalTime: new Date(`2000-01-01T${estimatedArrivalTime}`),
        seasonStart: seasonStart ? new Date(seasonStart) : null,
        seasonEnd: seasonEnd ? new Date(seasonEnd) : null,
        active,
      },
    });

    return NextResponse.json({ routeSchedule }, { status: 201 });
  } catch (error) {
    console.error("Error creating route schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
