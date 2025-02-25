import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, ScheduleStatus } from "@prisma/client";

// Get all schedules with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("routeId");
    const busId = searchParams.get("busId");
    const status = searchParams.get("status");
    const primaryDriverId = searchParams.get("primaryDriverId");
    const secondaryDriverId = searchParams.get("secondaryDriverId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const routeScheduleId = searchParams.get("routeScheduleId");

    // Build where clause
    const whereClause: Prisma.ScheduleWhereInput = {};

    if (routeId) whereClause.routeId = routeId;
    if (busId) whereClause.busId = busId;
    if (status) whereClause.status = status as ScheduleStatus;
    if (primaryDriverId) whereClause.primaryDriverId = primaryDriverId;
    if (secondaryDriverId) whereClause.secondaryDriverId = secondaryDriverId;
    if (routeScheduleId) whereClause.routeScheduleId = routeScheduleId;

    // Handle date range filtering
    if (fromDate || toDate) {
      whereClause.departureDate = {};

      if (fromDate) {
        whereClause.departureDate.gte = new Date(fromDate);
      }

      if (toDate) {
        whereClause.departureDate.lte = new Date(toDate);
      }
    }

    // Get schedules
    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        bus: {
          select: {
            id: true,
            plateNumber: true,
            template: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        routeSchedule: {
          include: {
            route: {
              include: {
                origin: true,
                destination: true,
              },
            },
          },
        },
        primaryDriver: {
          select: {
            id: true,
            fullName: true,
          },
        },
        secondaryDriver: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            tickets: true,
            parcels: true,
          },
        },
      },
      orderBy: {
        departureDate: "asc",
      },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new schedule
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const {
      routeId,
      routeScheduleId,
      busId,
      departureDate,
      estimatedArrivalTime,
      price,
      status,
      primaryDriverId,
      secondaryDriverId,
    } = json;

    // Validate required fields
    if (
      !routeId ||
      !routeScheduleId ||
      !busId ||
      !departureDate ||
      !estimatedArrivalTime ||
      price === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required schedule information" },
        { status: 400 }
      );
    }

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Check if route schedule exists
    const routeSchedule = await prisma.routeSchedule.findUnique({
      where: { id: routeScheduleId },
    });

    if (!routeSchedule) {
      return NextResponse.json(
        { error: "Route schedule not found" },
        { status: 404 }
      );
    }

    // Check if bus exists
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
    });

    if (!bus) {
      return NextResponse.json({ error: "Bus not found" }, { status: 404 });
    }

    // Check if bus is active and not in maintenance
    if (!bus.isActive || bus.maintenanceStatus !== "active") {
      return NextResponse.json(
        { error: "Bus is not active or is under maintenance" },
        { status: 400 }
      );
    }

    // Check if primary driver exists if provided
    if (primaryDriverId) {
      const primaryDriver = await prisma.driver.findUnique({
        where: { id: primaryDriverId },
      });

      if (!primaryDriver) {
        return NextResponse.json(
          { error: "Primary driver not found" },
          { status: 404 }
        );
      }

      if (!primaryDriver.active) {
        return NextResponse.json(
          { error: "Primary driver is not active" },
          { status: 400 }
        );
      }
    }

    // Check if secondary driver exists if provided
    if (secondaryDriverId) {
      const secondaryDriver = await prisma.driver.findUnique({
        where: { id: secondaryDriverId },
      });

      if (!secondaryDriver) {
        return NextResponse.json(
          { error: "Secondary driver not found" },
          { status: 404 }
        );
      }

      if (!secondaryDriver.active) {
        return NextResponse.json(
          { error: "Secondary driver is not active" },
          { status: 400 }
        );
      }
    }

    // Check if bus is already assigned to another schedule at the same time
    const overlappingSchedule = await prisma.schedule.findFirst({
      where: {
        busId,
        OR: [
          {
            departureDate: {
              lte: new Date(departureDate),
            },
            estimatedArrivalTime: {
              gte: new Date(departureDate),
            },
          },
          {
            departureDate: {
              lte: new Date(estimatedArrivalTime),
            },
            estimatedArrivalTime: {
              gte: new Date(estimatedArrivalTime),
            },
          },
          {
            departureDate: {
              gte: new Date(departureDate),
            },
            estimatedArrivalTime: {
              lte: new Date(estimatedArrivalTime),
            },
          },
        ],
        status: {
          in: ["scheduled", "in_progress"],
        },
      },
    });

    if (overlappingSchedule) {
      return NextResponse.json(
        {
          error:
            "Bus is already assigned to another schedule during this time period",
        },
        { status: 409 }
      );
    }

    // Check if primary driver is already assigned to another schedule at the same time
    if (primaryDriverId) {
      const overlappingPrimaryDriverSchedule = await prisma.schedule.findFirst({
        where: {
          OR: [
            {
              primaryDriverId,
              OR: [
                {
                  departureDate: {
                    lte: new Date(departureDate),
                  },
                  estimatedArrivalTime: {
                    gte: new Date(departureDate),
                  },
                },
                {
                  departureDate: {
                    lte: new Date(estimatedArrivalTime),
                  },
                  estimatedArrivalTime: {
                    gte: new Date(estimatedArrivalTime),
                  },
                },
                {
                  departureDate: {
                    gte: new Date(departureDate),
                  },
                  estimatedArrivalTime: {
                    lte: new Date(estimatedArrivalTime),
                  },
                },
              ],
            },
            {
              secondaryDriverId: primaryDriverId,
              OR: [
                {
                  departureDate: {
                    lte: new Date(departureDate),
                  },
                  estimatedArrivalTime: {
                    gte: new Date(departureDate),
                  },
                },
                {
                  departureDate: {
                    lte: new Date(estimatedArrivalTime),
                  },
                  estimatedArrivalTime: {
                    gte: new Date(estimatedArrivalTime),
                  },
                },
                {
                  departureDate: {
                    gte: new Date(departureDate),
                  },
                  estimatedArrivalTime: {
                    lte: new Date(estimatedArrivalTime),
                  },
                },
              ],
            },
          ],
        },
      });

      if (overlappingPrimaryDriverSchedule) {
        return NextResponse.json(
          {
            error:
              "Primary driver is already assigned to another schedule during this time period",
          },
          { status: 409 }
        );
      }
    }

    // Check if secondary driver is already assigned to another schedule at the same time
    if (secondaryDriverId) {
      const overlappingSecondaryDriverSchedule =
        await prisma.schedule.findFirst({
          where: {
            OR: [
              {
                primaryDriverId: secondaryDriverId,
                OR: [
                  {
                    departureDate: {
                      lte: new Date(departureDate),
                    },
                    estimatedArrivalTime: {
                      gte: new Date(departureDate),
                    },
                  },
                  {
                    departureDate: {
                      lte: new Date(estimatedArrivalTime),
                    },
                    estimatedArrivalTime: {
                      gte: new Date(estimatedArrivalTime),
                    },
                  },
                  {
                    departureDate: {
                      gte: new Date(departureDate),
                    },
                    estimatedArrivalTime: {
                      lte: new Date(estimatedArrivalTime),
                    },
                  },
                ],
              },
              {
                secondaryDriverId,
                OR: [
                  {
                    departureDate: {
                      lte: new Date(departureDate),
                    },
                    estimatedArrivalTime: {
                      gte: new Date(departureDate),
                    },
                  },
                  {
                    departureDate: {
                      lte: new Date(estimatedArrivalTime),
                    },
                    estimatedArrivalTime: {
                      gte: new Date(estimatedArrivalTime),
                    },
                  },
                  {
                    departureDate: {
                      gte: new Date(departureDate),
                    },
                    estimatedArrivalTime: {
                      lte: new Date(estimatedArrivalTime),
                    },
                  },
                ],
              },
            ],
          },
        });

      if (overlappingSecondaryDriverSchedule) {
        return NextResponse.json(
          {
            error:
              "Secondary driver is already assigned to another schedule during this time period",
          },
          { status: 409 }
        );
      }
    }

    // Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        routeId,
        routeScheduleId,
        busId,
        departureDate: new Date(departureDate),
        estimatedArrivalTime: new Date(estimatedArrivalTime),
        price,
        status: status || "scheduled",
        primaryDriverId,
        secondaryDriverId,
      },
      include: {
        bus: true,
        routeSchedule: {
          include: {
            route: {
              include: {
                origin: true,
                destination: true,
              },
            },
          },
        },
        primaryDriver: true,
        secondaryDriver: true,
      },
    });

    // Create bus assignment
    await prisma.busAssignment.create({
      data: {
        busId,
        routeId,
        scheduleId: schedule.id,
        startTime: new Date(departureDate),
        endTime: new Date(estimatedArrivalTime),
        status: "active",
      },
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
