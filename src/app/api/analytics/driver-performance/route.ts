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

    // Get top performing drivers (most completed trips)
    const topDrivers = await prisma.driver.findMany({
      where: {
        active: true,
      },
      take: 5,
      select: {
        id: true,
        fullName: true,
        _count: {
          select: {
            Trip: {
              where: {
                status: "completed",
              },
            },
          },
        },
        Trip: {
          take: 10,
          where: {
            status: "completed",
          },
          select: {
            departureTime: true,
            arrivalTime: true,
            tickets: {
              select: {
                price: true,
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

    // Process driver data to calculate more metrics
    const processedDrivers = topDrivers.map((driver) => {
      // Calculate total revenue generated
      const totalRevenue = driver.Trip.reduce((sum, trip) => {
        return (
          sum +
          trip.tickets.reduce((tripSum, ticket) => {
            return tripSum + (Number(ticket.price) || 0);
          }, 0)
        );
      }, 0);

      // Calculate on-time percentage (when arrival is within 30 min of scheduled time)
      const tripsWithBothTimes = driver.Trip.filter(
        (trip) => trip.departureTime && trip.arrivalTime
      );

      const onTimeTrips = tripsWithBothTimes.filter((trip) => {
        const departureTime = new Date(trip.departureTime);
        const arrivalTime = new Date(trip.arrivalTime);
        const estimatedDuration = departureTime.getTime() + 4 * 60 * 60 * 1000; // Assuming 4 hours is average trip duration
        const actualArrival = arrivalTime.getTime();

        // Trip is on time if arrival is within 30 minutes of estimated
        return Math.abs(actualArrival - estimatedDuration) <= 30 * 60 * 1000;
      });

      const onTimePercentage =
        tripsWithBothTimes.length > 0
          ? Math.round((onTimeTrips.length / tripsWithBothTimes.length) * 100)
          : 100;

      return {
        id: driver.id,
        name: driver.fullName,
        completedTrips: driver._count.Trip,
        totalRevenue,
        onTimePercentage,
        averageRevenuePerTrip:
          driver._count.Trip > 0
            ? Math.round(totalRevenue / driver._count.Trip)
            : 0,
      };
    });

    // Get bus utilization data
    const busUtilization = await prisma.bus.findMany({
      where: {
        isActive: true,
      },
      take: 5,
      select: {
        id: true,
        plateNumber: true,
        maintenanceStatus: true,
        _count: {
          select: {
            Trip: true,
          },
        },
        Trip: {
          select: {
            _count: {
              select: {
                tickets: true,
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

    // Process bus data
    const processedBuses = busUtilization.map((bus) => {
      const totalPassengers = bus.Trip.reduce((sum, trip) => {
        return sum + trip._count.tickets;
      }, 0);

      return {
        id: bus.id,
        plateNumber: bus.plateNumber,
        maintenanceStatus: bus.maintenanceStatus,
        totalTrips: bus._count.Trip,
        totalPassengers,
        averagePassengersPerTrip:
          bus._count.Trip > 0
            ? Math.round(totalPassengers / bus._count.Trip)
            : 0,
      };
    });

    return NextResponse.json({
      topDrivers: processedDrivers,
      busUtilization: processedBuses,
    });
  } catch (error) {
    console.error(
      "Driver Performance API error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Failed to fetch driver performance data" },
      { status: 500 }
    );
  }
}
