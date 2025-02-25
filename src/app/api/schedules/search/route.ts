import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { Schedule, Location } from "@prisma/client";
// Define a proper type for the schedule with availability
type ScheduleWithAvailability = Schedule & {
  availableSeats: number;
  totalSeats: number;
  hasEnoughSeats: boolean;
  _count: {
    tickets: number;
  };
  bus: {
    id: string;
    plateNumber: string;
    template?: {
      id: string;
      name: string;
      type: string;
    };
  } | null;
  routeSchedule: {
    route: {
      origin: Location;
      destination: Location;
    };
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const originId = searchParams.get("originId");
    const destinationId = searchParams.get("destinationId");
    const departureDate = searchParams.get("departureDate");
    const returnDate = searchParams.get("returnDate");
    const passengers = Number.parseInt(searchParams.get("passengers") || "1");

    if (!originId || !destinationId || !departureDate) {
      return NextResponse.json(
        { error: "Origin, destination, and departure date are required" },
        { status: 400 }
      );
    }

    // Parse dates
    const departureDateObj = new Date(departureDate);
    departureDateObj.setHours(0, 0, 0, 0);

    const nextDay = new Date(departureDateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    // Build where clause for outbound journey
    const outboundWhereClause: Prisma.ScheduleWhereInput = {
      routeSchedule: {
        route: {
          originId,
          destinationId,
        },
      },
      departureDate: {
        gte: departureDateObj,
        lt: nextDay,
      },
      status: "scheduled",
    };

    // Get outbound schedules
    const outboundSchedules = await prisma.schedule.findMany({
      where: outboundWhereClause,
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
        _count: {
          select: {
            tickets: {
              where: {
                status: "active",
              },
            },
          },
        },
      },
      orderBy: {
        departureDate: "asc",
      },
    });

    // Calculate available seats for each schedule
    const outboundWithAvailability = await Promise.all(
      outboundSchedules.map(async (schedule) => {
        const totalSeats = await prisma.busSeat.count({
          where: {
            busId: schedule.busId || "",
            isActive: true,
            status: "available",
          },
        });

        const bookedSeats = schedule._count.tickets;
        const availableSeats = totalSeats - bookedSeats;

        return {
          ...schedule,
          availableSeats,
          totalSeats,
          hasEnoughSeats: availableSeats >= passengers,
        };
      })
    );

    // Filter schedules with enough seats
    const availableOutboundSchedules = outboundWithAvailability.filter(
      (schedule) => schedule.hasEnoughSeats
    );

    // If return date is provided, search for return schedules
    let availableReturnSchedules: ScheduleWithAvailability[] = [];
    if (returnDate) {
      const returnDateObj = new Date(returnDate);
      returnDateObj.setHours(0, 0, 0, 0);

      const returnNextDay = new Date(returnDateObj);
      returnNextDay.setDate(returnNextDay.getDate() + 1);

      // Build where clause for return journey
      const returnWhereClause: Prisma.ScheduleWhereInput = {
        routeSchedule: {
          route: {
            originId: destinationId,
            destinationId: originId,
          },
        },
        departureDate: {
          gte: returnDateObj,
          lt: returnNextDay,
        },
        status: "scheduled",
      };

      // Get return schedules
      const returnSchedules = await prisma.schedule.findMany({
        where: returnWhereClause,
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
          _count: {
            select: {
              tickets: {
                where: {
                  status: "active",
                },
              },
            },
          },
        },
        orderBy: {
          departureDate: "asc",
        },
      });

      // Calculate available seats for each return schedule
      const returnWithAvailability = await Promise.all(
        returnSchedules.map(async (schedule) => {
          const totalSeats = await prisma.busSeat.count({
            where: {
              busId: schedule.busId || "",
              isActive: true,
              status: "available",
            },
          });

          const bookedSeats = schedule._count.tickets;
          const availableSeats = totalSeats - bookedSeats;

          return {
            ...schedule,
            availableSeats,
            totalSeats,
            hasEnoughSeats: availableSeats >= passengers,
          };
        })
      );

      // Filter return schedules with enough seats
      availableReturnSchedules = returnWithAvailability.filter(
        (schedule) => schedule.hasEnoughSeats
      );
    }

    return NextResponse.json({
      outbound: availableOutboundSchedules,
      return: availableReturnSchedules,
    });
  } catch (error) {
    console.error("Error searching schedules:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
