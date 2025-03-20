import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total sales amount (sum of payments)
    const totalSales = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
    });

    // Get total passengers (count of tickets with active status)
    const totalPassengers = await prisma.ticket.count({
      where: {
        status: "active",
      },
    });

    // Get active buses
    const activeBuses = await prisma.bus.count({
      where: {
        isActive: true,
      },
    });

    // Get buses in route (count of buses in current trips)
    const busesInRoute = await prisma.trip.count({
      where: {
        status: "in_progress",
      },
    });

    // Get total parcels
    const totalParcels = await prisma.parcel.count();

    // Get percentage of on-time deliveries
    const deliveredParcels = await prisma.parcel.count({
      where: {
        status: "delivered",
      },
    });

    // Get top routes by ticket sales
    const topRoutes = await prisma.route.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        origin: {
          select: {
            name: true,
          },
        },
        destination: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            Trip: {
              where: {
                tickets: {
                  some: {},
                },
              },
            },
          },
        },
      },
      orderBy: {
        Trip: {
          _count: "desc",
        },
      },
    });

    // Get monthly sales for the last 6 months
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 5);

    const monthlySales = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "created_at") as month,
        SUM(amount) as total
      FROM payments
      WHERE "created_at" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "created_at")
      ORDER BY month ASC
    `;

    // Get upcoming departures - fixing the relation to route
    const upcomingDepartures = await prisma.schedule.findMany({
      where: {
        departureDate: {
          gte: new Date(),
        },
        status: "scheduled",
      },
      take: 5,
      orderBy: {
        departureDate: "asc",
      },
      select: {
        id: true,
        departureDate: true,
        routeSchedule: {
          select: {
            route: {
              select: {
                name: true,
                origin: {
                  select: { name: true },
                },
                destination: {
                  select: { name: true },
                },
              },
            },
          },
        },
        bus: {
          select: {
            plateNumber: true,
          },
        },
      },
    });

    // Process departures to match the expected format
    const processedDepartures = upcomingDepartures.map((schedule) => ({
      id: schedule.id,
      departureDate: schedule.departureDate,
      route: {
        name: schedule.routeSchedule.route.name,
        origin: {
          name: schedule.routeSchedule.route.origin.name,
        },
        destination: {
          name: schedule.routeSchedule.route.destination.name,
        },
      },
      bus: schedule.bus,
    }));

    // Get driver stats
    const driverStats = await prisma.driver.count({
      where: {
        active: true,
      },
    });

    // Calculate percentage of on-time deliveries
    const deliveryPercentage =
      totalParcels > 0
        ? Math.round((deliveredParcels / totalParcels) * 100)
        : 100;

    return NextResponse.json({
      totalSales: totalSales._sum.amount || 0,
      totalPassengers,
      activeBuses,
      busesInRoute,
      busesInTerminal: activeBuses - busesInRoute,
      totalParcels,
      deliveryPercentage,
      monthlySales,
      topRoutes,
      upcomingDepartures: processedDepartures,
      driverStats,
    });
  } catch (error) {
    console.error(
      "Analytics API error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
