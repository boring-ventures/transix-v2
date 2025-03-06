import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get available seats for a schedule
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get("scheduleId");
    const debug = searchParams.get("debug") === "true";

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Get the schedule with its bus
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        bus: true,
        routeSchedule: {
          include: {
            route: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    if (!schedule.busId) {
      return NextResponse.json(
        { error: "No bus assigned to this schedule" },
        { status: 400 }
      );
    }

    // Get all seats for the bus
    const allSeats = await prisma.busSeat.findMany({
      where: {
        busId: schedule.busId,
      },
      include: {
        tier: true,
      },
    });

    // Get all booked seats for this schedule
    const bookedTickets = await prisma.ticket.findMany({
      where: {
        scheduleId,
        status: "active",
      },
      select: {
        busSeatId: true,
      },
    });

    const bookedSeatIds = bookedTickets.map((ticket) => ticket.busSeatId);

    // Filter out booked seats and maintenance seats
    const availableSeats = allSeats.filter(
      (seat) =>
        !bookedSeatIds.includes(seat.id) &&
        seat.isActive &&
        seat.status === "available"
    );

    // If no seats are available, return all seats for debugging
    const allSeatsWithStatus = allSeats.map((seat) => ({
      ...seat,
      isBooked: bookedSeatIds.includes(seat.id),
      isAvailable:
        seat.isActive &&
        seat.status === "available" &&
        !bookedSeatIds.includes(seat.id),
    }));

    // Group seats by tier
    const seatsByTier = availableSeats.reduce(
      (acc, seat) => {
        const tierId = seat.tierId;
        if (!acc[tierId]) {
          acc[tierId] = [];
        }
        acc[tierId].push(seat);
        return acc;
      },
      {} as Record<string, typeof availableSeats>
    );

    // Include debugging information if requested
    const response = {
      schedule,
      availableSeats,
      seatsByTier,
      totalAvailable: availableSeats.length,
      totalCapacity: allSeats.length,
      occupancyRate:
        allSeats.length > 0
          ? (allSeats.length - availableSeats.length) / allSeats.length
          : 0,
    };

    if (debug) {
      return NextResponse.json({
        ...response,
        debug: {
          allSeats: allSeatsWithStatus,
          bookedSeatIds,
          busId: schedule.busId,
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching schedule availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 