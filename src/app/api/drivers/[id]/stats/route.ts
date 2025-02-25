import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Get counts of primary and secondary schedules
    const primarySchedulesCount = await prisma.schedule.count({
      where: { primaryDriverId: id },
    });

    const secondarySchedulesCount = await prisma.schedule.count({
      where: { secondaryDriverId: id },
    });

    // Get counts by schedule status
    const scheduledCount = await prisma.schedule.count({
      where: {
        OR: [
          { primaryDriverId: id },
          { secondaryDriverId: id }
        ],
        status: "scheduled"
      },
    });

    const completedCount = await prisma.schedule.count({
      where: {
        OR: [
          { primaryDriverId: id },
          { secondaryDriverId: id }
        ],
        status: "completed"
      },
    });

    const inProgressCount = await prisma.schedule.count({
      where: {
        OR: [
          { primaryDriverId: id },
          { secondaryDriverId: id }
        ],
        status: "in_progress"
      },
    });

    // Get upcoming schedules
    const upcomingSchedules = await prisma.schedule.findMany({
      where: {
        OR: [
          { primaryDriverId: id },
          { secondaryDriverId: id }
        ],
        status: "scheduled",
        departureDate: {
          gte: new Date(),
        },
      },
      include: {
        routeSchedule: {
          include: {
            route: {
              include: {
                origin: true,
                destination: true
              }
            }
          }
        },
        bus: true,
      },
      orderBy: {
        departureDate: "asc",
      },
      take: 5,
    });

    const stats = {
      totalTrips: primarySchedulesCount + secondarySchedulesCount,
      primaryDriverTrips: primarySchedulesCount,
      secondaryDriverTrips: secondarySchedulesCount,
      scheduledTrips: scheduledCount,
      completedTrips: completedCount,
      inProgressTrips: inProgressCount,
      upcomingSchedules,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching driver stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 