import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define interfaces for the seat matrix structure
interface SeatPosition {
  id: string;
  seatNumber?: string;
  name?: string;
  row?: number;
  column?: number;
  isEmpty?: boolean;
  status?: string;
  isActive?: boolean;
  isBooked?: boolean;
  isAvailable?: boolean;
  tierId?: string;
  tier?: {
    id: string;
    name: string;
    basePrice: number;
  } | null;
}

interface SeatMatrixFloor {
  dimensions: { rows: number; seatsPerRow: number };
  seats: SeatPosition[];
}

interface SeatMatrix {
  firstFloor: SeatMatrixFloor;
  secondFloor?: SeatMatrixFloor;
}

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
      floor:
        (scheduleSeat.busSeat as Record<string, unknown>)[
          "floor"
        ]?.toString() || "first", // Default to first floor if not specified
      row: (scheduleSeat.busSeat as Record<string, unknown>)["row"] as
        | number
        | undefined,
      column: (scheduleSeat.busSeat as Record<string, unknown>)["column"] as
        | number
        | undefined,
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

    // Get the original seat matrix from the bus to preserve the exact arrangement
    const originalSeatMatrix = schedule.bus?.seatMatrix
      ? JSON.parse(schedule.bus.seatMatrix as string)
      : null;

    // Create a seat matrix that preserves the original arrangement but updates seat status
    const seatMatrix = originalSeatMatrix
      ? createSeatMatrixWithStatus(
          originalSeatMatrix,
          processedSeats,
          bookedSeatIds
        )
      : {
          firstFloor: organizeSeatsIntoMatrix(
            processedSeats.filter((s) => s.floor === "first")
          ),
          secondFloor: processedSeats.some((s) => s.floor === "second")
            ? organizeSeatsIntoMatrix(
                processedSeats.filter((s) => s.floor === "second")
              )
            : undefined,
        };

    // Include debugging information if requested
    const response = {
      schedule,
      availableSeats,
      seatsByTier,
      seatMatrix,
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
          originalSeatMatrix,
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

// Helper function to create a seat matrix that preserves the original arrangement
// but updates seat status based on processed seats and booked seats
function createSeatMatrixWithStatus(
  originalMatrix: SeatMatrix,
  processedSeats: SeatPosition[],
  bookedSeatIds: string[]
) {
  const result: SeatMatrix = {
    firstFloor: {
      dimensions: originalMatrix.firstFloor.dimensions,
      seats: [],
    },
  };

  // Process first floor seats
  if (originalMatrix.firstFloor && originalMatrix.firstFloor.seats) {
    result.firstFloor.seats = originalMatrix.firstFloor.seats.map(
      (originalSeat: SeatPosition) => {
        // Find the corresponding processed seat
        const processedSeat = processedSeats.find(
          (s: SeatPosition) => s.seatNumber === originalSeat.id
        );

        if (!processedSeat) {
          // If no processed seat found, keep the original but mark as unavailable
          return {
            ...originalSeat,
            isAvailable: false,
            isBooked: false,
            floor: "first",
          };
        }

        // Update with processed seat information
        return {
          ...originalSeat,
          status: processedSeat.status,
          isActive: processedSeat.isActive,
          isBooked: bookedSeatIds.includes(processedSeat.id),
          isAvailable: processedSeat.isAvailable,
          tier: processedSeat.tier,
          floor: "first",
        };
      }
    );
  }

  // Process second floor if it exists
  if (originalMatrix.secondFloor && originalMatrix.secondFloor.seats) {
    result.secondFloor = {
      dimensions: originalMatrix.secondFloor.dimensions,
      seats: originalMatrix.secondFloor.seats.map((originalSeat) => {
        // Find the corresponding processed seat
        const processedSeat = processedSeats.find(
          (s) => s.seatNumber === originalSeat.id
        );

        if (!processedSeat) {
          // If no processed seat found, keep the original but mark as unavailable
          return {
            ...originalSeat,
            isAvailable: false,
            isBooked: false,
            floor: "second",
          };
        }

        // Update with processed seat information
        return {
          ...originalSeat,
          status: processedSeat.status,
          isActive: processedSeat.isActive,
          isBooked: bookedSeatIds.includes(processedSeat.id),
          isAvailable: processedSeat.isAvailable,
          tier: processedSeat.tier,
          floor: "second",
        };
      }),
    };
  }

  return result;
}

// Helper function to organize seats into a matrix format
function organizeSeatsIntoMatrix(seats: SeatPosition[]) {
  if (!seats || seats.length === 0)
    return { dimensions: { rows: 0, seatsPerRow: 0 }, seats: [] };

  // Find the maximum row and column to determine dimensions
  const maxRow =
    Math.max(...seats.map((seat: SeatPosition) => seat.row || 0)) + 1;
  const maxColumn =
    Math.max(...seats.map((seat: SeatPosition) => seat.column || 0)) + 1;

  return {
    dimensions: {
      rows: maxRow,
      seatsPerRow: maxColumn,
    },
    seats: seats,
  };
} 