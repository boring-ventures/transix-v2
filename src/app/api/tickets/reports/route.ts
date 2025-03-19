import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Filter parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const scheduleId = searchParams.get("scheduleId");
    const companyId = searchParams.get("companyId");
    const branchId = searchParams.get("branchId");
    const routeId = searchParams.get("routeId");

    // Build where clause
    const whereClause: any = {
      status: "active",
    };

    // Apply date filters if provided
    if (startDate && endDate) {
      whereClause.purchasedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.purchasedAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.purchasedAt = {
        lte: new Date(endDate),
      };
    }

    // Apply schedule filter if provided
    if (scheduleId) {
      whereClause.scheduleId = scheduleId;
    }

    // Apply route filter if provided
    if (routeId) {
      whereClause.schedule = {
        routeSchedule: {
          route: {
            id: routeId,
          },
        },
      };
    }

    // Apply company/branch filters to the seller profile
    if (companyId) {
      whereClause.profile = {
        companyId,
      };
    }

    if (branchId) {
      whereClause.profile = {
        ...(whereClause.profile || {}),
        branchId,
      };
    }

    // Get basic ticket stats
    const totalTickets = await prisma.ticket.count({
      where: whereClause,
    });

    // Get total sales amount
    const salesAmountResult = await prisma.ticket.aggregate({
      where: whereClause,
      _sum: {
        price: true,
      },
    });

    const totalSalesAmount = salesAmountResult._sum.price || 0;

    // Replace the raw SQL query with a Prisma query approach
    let salesByDay: { date: string; count: number; total: number }[] = [];

    try {
      // Get tickets for date grouping
      const tickets = await prisma.ticket.findMany({
        where: whereClause,
        select: {
          purchasedAt: true,
          price: true,
        },
      });

      // Group tickets by day manually
      const groupedByDay: Record<string, { count: number; total: number }> = {};

      for (const ticket of tickets) {
        const date = new Date(ticket.purchasedAt).toISOString().split("T")[0]; // Format: YYYY-MM-DD

        if (!groupedByDay[date]) {
          groupedByDay[date] = { count: 0, total: 0 };
        }

        groupedByDay[date].count += 1;
        groupedByDay[date].total += Number(ticket.price);
      }

      // Convert to array format
      salesByDay = Object.entries(groupedByDay)
        .map(([date, info]) => ({
          date,
          count: info.count,
          total: info.total,
        }))
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    } catch (err) {
      console.error("Error processing sales by day:", err);
      // Continue with empty array if this part fails
    }

    // Get top routes by ticket sales
    const topRoutes = await prisma.ticket.groupBy({
      by: ["scheduleId"],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        price: true,
      },
      orderBy: {
        _sum: {
          price: "desc",
        },
      },
      take: 5,
    });

    // Get the route info for the top routes
    const routeDetails = await Promise.all(
      topRoutes.map(async (route: any) => {
        const schedule = await prisma.schedule.findUnique({
          where: { id: route.scheduleId || "" },
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
          },
        });

        return {
          scheduleId: route.scheduleId,
          ticketCount: route._count.id,
          totalSales: route._sum.price,
          routeName: schedule?.routeSchedule?.route?.name || "Unknown",
          origin: schedule?.routeSchedule?.route?.origin?.name || "Unknown",
          destination:
            schedule?.routeSchedule?.route?.destination?.name || "Unknown",
          departureDate: schedule?.departureDate,
        };
      })
    );

    // Get top sellers
    const topSellers = await prisma.ticket.groupBy({
      by: ["purchasedBy"],
      where: {
        ...whereClause,
        purchasedBy: { not: null },
      },
      _count: {
        id: true,
      },
      _sum: {
        price: true,
      },
      orderBy: {
        _sum: {
          price: "desc",
        },
      },
      take: 5,
    });

    // Get seller details
    const sellerDetails = await Promise.all(
      topSellers.map(async (seller: any) => {
        if (!seller.purchasedBy) return null;

        const profile = await prisma.profile.findUnique({
          where: { id: seller.purchasedBy },
          include: {
            branch: true,
            company: true,
          },
        });

        return {
          profileId: seller.purchasedBy,
          ticketCount: seller._count.id,
          totalSales: seller._sum.price,
          fullName: profile?.fullName || "Unknown",
          email: profile?.email || "Unknown",
          branchName: profile?.branch?.name || "N/A",
          companyName: profile?.company?.name || "N/A",
        };
      })
    ).then((results) => results.filter(Boolean));

    // Log the data types for debugging
    console.log("Debug types:");
    console.log("totalSalesAmount type:", typeof totalSalesAmount);
    console.log("totalSalesAmount value:", totalSalesAmount);

    // Convert decimal values to proper numbers for the response
    const response = {
      totalTickets,
      totalSalesAmount: Number(totalSalesAmount),
      salesByDay: salesByDay.map((day) => ({
        ...day,
        total: Number(day.total),
      })),
      topRoutes: routeDetails.map((route) => ({
        ...route,
        totalSales: Number(route.totalSales),
      })),
      topSellers: sellerDetails
        .map((seller) =>
          seller
            ? {
                ...seller,
                totalSales: Number(seller.totalSales),
              }
            : null
        )
        .filter(Boolean),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching ticket sales reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
