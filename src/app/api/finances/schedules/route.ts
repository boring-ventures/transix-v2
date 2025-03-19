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
      where.routeSchedule = {
        routeId,
      };
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

    // For schedules without trip settlements
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

    // Fetch schedules with related data
    const schedules = await prisma.schedule.findMany({
      where,
      take: limit,
      include: {
        bus: true,
        primaryDriver: true,
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
        tickets: {
          select: {
            id: true,
            status: true,
            price: true,
          },
        },
        parcels: {
          select: {
            id: true,
            status: true,
            price: true,
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
        [sortBy]: sortOrder,
      },
    });

    // Format response
    const formattedSchedules = schedules.map((schedule) => {
      // Calculate total income from tickets and parcels
      const ticketIncome = schedule.tickets
        .filter(
          (ticket) => ticket.status === "sold" || ticket.status === "used"
        )
        .reduce((sum, ticket) => sum + Number(ticket.price), 0);

      const parcelIncome = schedule.parcels
        .filter(
          (parcel) =>
            parcel.status === "delivered" || parcel.status === "in_transit"
        )
        .reduce((sum, parcel) => sum + Number(parcel.price), 0);

      const totalIncome = ticketIncome + parcelIncome;

      // Format route information
      let routeInfo = null;
      if (schedule.routeSchedule?.route) {
        const route = schedule.routeSchedule.route;
        const originCode = route.origin.name.substring(0, 3).toUpperCase();
        const destinationCode = route.destination.name
          .substring(0, 3)
          .toUpperCase();

        routeInfo = {
          id: route.id,
          originCode,
          originName: route.origin.name,
          destinationCode,
          destinationName: route.destination.name,
          routeCode: `${originCode}-${destinationCode}`,
          routeName: `${route.origin.name} - ${route.destination.name}`,
        };
      }

      return {
        id: schedule.id,
        departureDate: schedule.departureDate,
        status: schedule.status,
        busId: schedule.busId,
        plateNumber: schedule.bus?.plateNumber,
        busType: schedule.bus?.busType,
        primaryDriverId: schedule.primaryDriverId,
        driverName: schedule.primaryDriver?.name,
        routeScheduleId: schedule.routeScheduleId,
        routeId: schedule.routeSchedule?.routeId,
        route: routeInfo,
        ticketsSold: schedule._count?.tickets || 0,
        parcelsSent: schedule._count?.parcels || 0,
        ticketIncome,
        parcelIncome,
        totalIncome,
        isSettled: false, // This will always be false based on the pendingLiquidation filter
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      };
    });

    return NextResponse.json({ schedules: formattedSchedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// Export the protected handlers
export const GET = withRoleProtection(getSchedules, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
