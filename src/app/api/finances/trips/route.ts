import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

async function getSchedules(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse filters
    const pendingLiquidation =
      searchParams.get("pendingLiquidation") === "true";
    const routeId = searchParams.get("routeId");
    const busId = searchParams.get("busId");
    const driverId = searchParams.get("primaryDriverId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "departureDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: any = {};

    if (routeId) {
      where.routeId = routeId;
    }

    if (busId) {
      where.busId = busId;
    }

    if (driverId) {
      where.primaryDriverId = driverId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.departureDate = {};

      if (startDate) {
        where.departureDate.gte = new Date(startDate);
      }

      if (endDate) {
        where.departureDate.lte = new Date(endDate);
      }
    }

    // For schedules without liquidations
    if (pendingLiquidation) {
      where.tripSettlements = { none: {} };
      // Only include completed trips
      where.status = "completed";
      // Only include trips from the last 90 days
      where.departureDate = {
        ...where.departureDate,
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      };
    }

    // Query for schedules with related data
    const schedules = await prisma.schedule.findMany({
      where,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
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
        bus: {
          select: {
            id: true,
            plateNumber: true,
            template: {
              select: {
                name: true,
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
        tickets: {
          where: {
            status: "active",
          },
          select: {
            id: true,
            price: true,
          },
        },
        _count: {
          select: {
            tickets: {
              where: {
                status: "active",
              },
            },
          },
        },
        tripSettlements: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Format the response
    const formattedSchedules = schedules.map((schedule) => {
      // Calculate total income based on tickets
      const totalIncome = schedule.tickets.reduce(
        (sum, ticket) =>
          sum +
          (typeof ticket.price === "object"
            ? ticket.price.toNumber()
            : Number(ticket.price)),
        0
      );

      // Get route information
      const route = schedule.routeSchedule.route;

      return {
        id: schedule.id,
        departureTime: schedule.departureDate,
        status: schedule.status,
        route: {
          id: route.id,
          originCode: route.origin.name.substring(0, 3).toUpperCase(),
          originName: route.origin.name,
          destinationCode: route.destination.name.substring(0, 3).toUpperCase(),
          destinationName: route.destination.name,
          name: route.name,
        },
        bus: schedule.bus
          ? {
              id: schedule.bus.id,
              plate: schedule.bus.plateNumber,
              model: schedule.bus.template?.name || "Unknown",
            }
          : null,
        driver: schedule.primaryDriver
          ? {
              id: schedule.primaryDriver.id,
              name: schedule.primaryDriver.fullName,
            }
          : null,
        ticketsCount: schedule._count.tickets,
        totalIncome,
        hasLiquidation: schedule.tripSettlements.length > 0,
        liquidationId: schedule.tripSettlements[0]?.id || null,
        liquidationStatus: schedule.tripSettlements[0]?.status || null,
      };
    });

    return NextResponse.json(formattedSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

async function createTrip(req: NextRequest) {
  try {
    const body = await req.json();
    const { scheduleId, routeId, departureTime, status, createdBy } = body;

    // Validate required fields - either scheduleId or routeId is required
    if (!scheduleId && !routeId) {
      return NextResponse.json(
        { error: "Either scheduleId or routeId is required" },
        { status: 400 }
      );
    }

    // Default departure time if not provided
    const effectiveDepartureTime = departureTime
      ? new Date(departureTime)
      : new Date();

    // If scheduleId is provided, check if it exists and get additional data
    let effectiveRouteId = routeId;
    let busId = null;
    let driverId = null;

    if (scheduleId) {
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          routeSchedule: true,
          bus: true,
          primaryDriver: true,
        },
      });

      if (!schedule) {
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 }
        );
      }

      // Use schedule's route if routeId not provided
      if (!effectiveRouteId && schedule.routeSchedule) {
        effectiveRouteId = schedule.routeSchedule.routeId;
      }

      // Get bus and driver info if available
      if (schedule.bus) {
        busId = schedule.bus.id;
      }

      if (schedule.primaryDriver) {
        driverId = schedule.primaryDriver.id;
      }
    }

    // If we still don't have a routeId, try to find any route
    if (!effectiveRouteId) {
      // Find any available route
      const fallbackRoute = await prisma.route.findFirst({
        where: { active: true },
      });

      if (fallbackRoute) {
        effectiveRouteId = fallbackRoute.id;
      } else {
        return NextResponse.json(
          { error: "No valid route found and none provided" },
          { status: 400 }
        );
      }
    }

    // Create the trip with required fields based on the Trip model
    const tripData: {
      routeId: string;
      departureTime: Date;
      status: string;
      busId: string;
      driverId: string;
    } = {
      routeId: effectiveRouteId,
      departureTime: effectiveDepartureTime,
      status: status || "completed",
      busId: "", // Will be set below
      driverId: "", // Will be set below
    };

    // Set busId - either from input or from default
    if (busId) {
      tripData.busId = busId;
    } else {
      const defaultBusId = await getDefaultBusId();
      if (defaultBusId) {
        tripData.busId = defaultBusId;
      } else {
        return NextResponse.json(
          { error: "No valid bus found and none can be assigned" },
          { status: 400 }
        );
      }
    }

    // Set driverId - either from input or from default
    if (driverId) {
      tripData.driverId = driverId;
    } else {
      const defaultDriverId = await getDefaultDriverId();
      if (defaultDriverId) {
        tripData.driverId = defaultDriverId;
      } else {
        return NextResponse.json(
          { error: "No valid driver found and none can be assigned" },
          { status: 400 }
        );
      }
    }

    const trip = await prisma.trip.create({
      data: tripData,
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating trip:", error);

    const tripError = error as { message?: string };

    // Provide more helpful error message based on the error
    if (
      tripError.message &&
      tripError.message.includes("Foreign key constraint failed")
    ) {
      return NextResponse.json(
        {
          error:
            "Failed to create trip: Invalid reference to required related entity",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
}

// Helper function to get a default busId if none is available
async function getDefaultBusId() {
  // Get any bus that is active
  const bus = await prisma.bus.findFirst({
    where: { isActive: true },
  });

  if (!bus) {
    throw new Error("No active buses found in the system");
  }

  return bus.id;
}

// Helper function to get a default driverId if none is available
async function getDefaultDriverId() {
  // Get any driver that is active
  const driver = await prisma.driver.findFirst({
    where: { active: true },
  });

  if (!driver) {
    throw new Error("No active drivers found in the system");
  }

  return driver.id;
}

// Export the protected handler
export const GET = withRoleProtection(getSchedules, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const POST = withRoleProtection(createTrip, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
