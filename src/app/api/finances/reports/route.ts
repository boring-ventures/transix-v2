import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

async function getFinancialReports(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse report parameters
    const reportType = searchParams.get("type") || "general"; // general, route, bus, driver
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const routeId = searchParams.get("routeId");
    const busId = searchParams.get("busId");
    const driverId = searchParams.get("driverId");
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    // Build date range filter
    const dateRange: any = {};
    if (startDate) {
      dateRange.gte = new Date(startDate);
    }
    if (endDate) {
      dateRange.lte = new Date(endDate);
    }

    // Build the where clause
    const where: any = {};
    if (Object.keys(dateRange).length > 0) {
      where.departureTime = dateRange;
    }
    if (routeId) {
      where.routeId = routeId;
    }
    if (busId) {
      where.busId = busId;
    }
    if (driverId) {
      where.driverId = driverId;
    }

    // Base query with common fields
    let trips = await prisma.trip.findMany({
      where,
      include: {
        route: {
          select: {
            id: true,
            originCode: true,
            originName: true,
            destinationCode: true,
            destinationName: true,
          },
        },
        bus: {
          select: {
            id: true,
            plate: true,
            model: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
        tickets: {
          where: {
            status: "active",
          },
          select: {
            price: true,
          },
        },
        expenses: {
          select: {
            amount: true,
            category: true,
          },
        },
        liquidation: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        departureTime: "desc",
      },
    });

    // Calculate financial metrics for each trip
    const processedTrips = trips.map((trip) => {
      const totalIncome = trip.tickets.reduce(
        (sum, ticket) => sum + ticket.price,
        new Decimal(0)
      );

      const totalExpenses = trip.expenses.reduce(
        (sum, expense) => sum + expense.amount,
        new Decimal(0)
      );

      const netAmount = totalIncome.minus(totalExpenses);

      return {
        id: trip.id,
        departureTime: trip.departureTime,
        route: {
          id: trip.route.id,
          code: `${trip.route.originCode}-${trip.route.destinationCode}`,
          name: `${trip.route.originName} - ${trip.route.destinationName}`,
        },
        bus: trip.bus
          ? {
              id: trip.bus.id,
              plate: trip.bus.plate,
              model: trip.bus.model,
            }
          : null,
        driver: trip.driver
          ? {
              id: trip.driver.id,
              name: trip.driver.name,
            }
          : null,
        ticketsCount: trip.tickets.length,
        status: trip.liquidation?.status || "pending",
        totalIncome: totalIncome.toNumber(),
        totalExpenses: totalExpenses.toNumber(),
        netAmount: netAmount.toNumber(),
      };
    });

    // Generate summary statistics
    const totalIncome = processedTrips.reduce(
      (sum, trip) => sum + trip.totalIncome,
      0
    );

    const totalExpenses = processedTrips.reduce(
      (sum, trip) => sum + trip.totalExpenses,
      0
    );

    const netAmount = totalIncome - totalExpenses;

    const totalTrips = processedTrips.length;

    // Generate aggregated data based on report type
    let aggregatedData: any[] = [];

    switch (reportType) {
      case "route":
        // Group by route
        const routeMap = new Map();

        processedTrips.forEach((trip) => {
          const routeId = trip.route.id;
          if (!routeMap.has(routeId)) {
            routeMap.set(routeId, {
              routeId,
              routeCode: trip.route.code,
              routeName: trip.route.name,
              tripsCount: 0,
              totalIncome: 0,
              totalExpenses: 0,
              netAmount: 0,
            });
          }

          const routeData = routeMap.get(routeId);
          routeData.tripsCount += 1;
          routeData.totalIncome += trip.totalIncome;
          routeData.totalExpenses += trip.totalExpenses;
          routeData.netAmount += trip.netAmount;
        });

        aggregatedData = Array.from(routeMap.values());
        break;

      case "bus":
        // Group by bus
        const busMap = new Map();

        processedTrips.forEach((trip) => {
          if (!trip.bus) return;

          const busId = trip.bus.id;
          if (!busMap.has(busId)) {
            busMap.set(busId, {
              busId,
              plate: trip.bus.plate,
              model: trip.bus.model,
              tripsCount: 0,
              totalIncome: 0,
              totalExpenses: 0,
              netAmount: 0,
            });
          }

          const busData = busMap.get(busId);
          busData.tripsCount += 1;
          busData.totalIncome += trip.totalIncome;
          busData.totalExpenses += trip.totalExpenses;
          busData.netAmount += trip.netAmount;
        });

        aggregatedData = Array.from(busMap.values());
        break;

      case "driver":
        // Group by driver
        const driverMap = new Map();

        processedTrips.forEach((trip) => {
          if (!trip.driver) return;

          const driverId = trip.driver.id;
          if (!driverMap.has(driverId)) {
            driverMap.set(driverId, {
              driverId,
              driverName: trip.driver.name,
              tripsCount: 0,
              totalIncome: 0,
              totalExpenses: 0,
              netAmount: 0,
            });
          }

          const driverData = driverMap.get(driverId);
          driverData.tripsCount += 1;
          driverData.totalIncome += trip.totalIncome;
          driverData.totalExpenses += trip.totalExpenses;
          driverData.netAmount += trip.netAmount;
        });

        aggregatedData = Array.from(driverMap.values());
        break;

      case "time":
        // Group by time period
        const timeMap = new Map();

        processedTrips.forEach((trip) => {
          let timeKey;
          const date = new Date(trip.departureTime);

          if (groupBy === "day") {
            timeKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
          } else if (groupBy === "week") {
            // Get week start date (Sunday)
            const day = date.getDay();
            const diff = date.getDate() - day;
            const weekStart = new Date(date);
            weekStart.setDate(diff);
            timeKey = weekStart.toISOString().split("T")[0];
          } else if (groupBy === "month") {
            timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          }

          if (!timeMap.has(timeKey)) {
            timeMap.set(timeKey, {
              timePeriod: timeKey,
              periodType: groupBy,
              tripsCount: 0,
              totalIncome: 0,
              totalExpenses: 0,
              netAmount: 0,
            });
          }

          const timeData = timeMap.get(timeKey);
          timeData.tripsCount += 1;
          timeData.totalIncome += trip.totalIncome;
          timeData.totalExpenses += trip.totalExpenses;
          timeData.netAmount += trip.netAmount;
        });

        aggregatedData = Array.from(timeMap.values()).sort((a, b) => {
          return a.timePeriod.localeCompare(b.timePeriod);
        });
        break;

      default:
        // Use processedTrips directly for general report
        aggregatedData = processedTrips;
    }

    return NextResponse.json({
      summary: {
        totalTrips,
        totalIncome,
        totalExpenses,
        netAmount,
        periodStart: startDate ? new Date(startDate) : null,
        periodEnd: endDate ? new Date(endDate) : null,
      },
      data: aggregatedData,
    });
  } catch (error) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Failed to generate financial report" },
      { status: 500 }
    );
  }
}

// Export the protected handler
export const GET = withRoleProtection(getFinancialReports, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
