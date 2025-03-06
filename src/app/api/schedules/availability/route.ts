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

    // Check if schedule seats exist
    const scheduleSeatsCount = await prisma.scheduleSeat.count({
      where: { scheduleId },
    });

    const hasScheduleSeats = scheduleSeatsCount > 0;

    // If no schedule seats exist, create them
    if (!hasScheduleSeats) {
      // Get all seats for the bus
      const busSeats = await prisma.busSeat.findMany({
        where: {
          busId: schedule.busId,
          isActive: true,
        },
      });

      // Create schedule seats for each bus seat
      if (busSeats.length > 0) {
        for (const seat of busSeats) {
          await prisma.scheduleSeat.create({
            data: {
              scheduleId,
              busSeatId: seat.id,
              status: seat.status,
              isActive: seat.isActive,
            },
          });
        }
      }
    }

    // Get all schedule seats with their bus seats and tiers
    const scheduleSeats = await prisma.scheduleSeat.findMany({
      where: { scheduleId },
      include: {
        busSeat: {
          include: {
            tier: true,
          },
        },
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

    // Process seats for the response
    const processedSeats = scheduleSeats.map((scheduleSeat) => ({
      id: scheduleSeat.busSeatId,
      status: scheduleSeat.status,
      isActive: scheduleSeat.isActive,
      seatNumber: scheduleSeat.busSeat.seatNumber,
      tierId: scheduleSeat.busSeat.tierId,
      isBooked: bookedSeatIds.includes(scheduleSeat.busSeatId),
      isAvailable:
        scheduleSeat.isActive &&
        scheduleSeat.status === "available" &&
        !bookedSeatIds.includes(scheduleSeat.busSeatId),
      tier: scheduleSeat.busSeat.tier
        ? {
            id: scheduleSeat.busSeat.tier.id,
            name: scheduleSeat.busSeat.tier.name,
            basePrice: Number(scheduleSeat.busSeat.tier.basePrice),
          }
        : null,
    }));

    // Filter out booked seats and maintenance seats for available seats
    const availableSeats = processedSeats.filter((seat) => seat.isAvailable);

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
      totalCapacity: processedSeats.length,
      occupancyRate:
        processedSeats.length > 0
          ? (processedSeats.length - availableSeats.length) /
            processedSeats.length
          : 0,
    };

    if (debug) {
      return NextResponse.json({
        ...response,
        debug: {
          allSeats: processedSeats,
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