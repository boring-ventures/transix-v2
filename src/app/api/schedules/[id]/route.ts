import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ScheduleStatus } from "@prisma/client";

// Get a specific schedule by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        bus: {
          include: {
            template: true,
            busSeats: {
              include: {
                tier: true,
              },
              orderBy: {
                seatNumber: "asc",
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
        primaryDriver: true,
        secondaryDriver: true,
        tickets: {
          include: {
            customer: true,
            busSeat: {
              include: {
                tier: true,
              },
            },
          },
        },
        parcels: {
          include: {
            sender: true,
            receiver: true,
            statusUpdates: {
              orderBy: {
                updatedAt: "desc",
              },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            tickets: true,
            parcels: true,
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

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a schedule
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const {
      busId,
      departureDate,
      estimatedArrivalTime,
      actualDepartureTime,
      actualArrivalTime,
      price,
      status,
      primaryDriverId,
      secondaryDriverId,
    } = json;

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        tickets: true,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // If changing bus, check if new bus exists and is available
    if (busId && busId !== existingSchedule.busId) {
      const bus = await prisma.bus.findUnique({
        where: { id: busId },
      });

      if (!bus) {
        return NextResponse.json({ error: "Bus not found" }, { status: 404 });
      }

      if (!bus.isActive || bus.maintenanceStatus !== "active") {
        return NextResponse.json(
          { error: "Bus is not active or is under maintenance" },
          { status: 400 }
        );
      }

      // Check if bus is already assigned to another schedule at the same time
      const departureTimeToCheck = departureDate
        ? new Date(departureDate)
        : existingSchedule.departureDate;

      const arrivalTimeToCheck = estimatedArrivalTime
        ? new Date(estimatedArrivalTime)
        : existingSchedule.estimatedArrivalTime;

      const overlappingSchedule = await prisma.schedule.findFirst({
        where: {
          id: { not: id }, // Exclude current schedule
          busId,
          OR: [
            {
              departureDate: {
                lte: departureTimeToCheck,
              },
              estimatedArrivalTime: {
                gte: departureTimeToCheck,
              },
            },
            {
              departureDate: {
                lte: arrivalTimeToCheck,
              },
              estimatedArrivalTime: {
                gte: arrivalTimeToCheck,
              },
            },
            {
              departureDate: {
                gte: departureTimeToCheck,
              },
              estimatedArrivalTime: {
                lte: arrivalTimeToCheck,
              },
            },
          ],
          status: {
            in: ["scheduled", "in_progress"],
          },
        },
      });

      if (overlappingSchedule) {
        return NextResponse.json(
          {
            error:
              "Bus is already assigned to another schedule during this time period",
          },
          { status: 409 }
        );
      }
    }

    // If changing primary driver, check if new driver exists and is available
    if (
      primaryDriverId &&
      primaryDriverId !== existingSchedule.primaryDriverId
    ) {
      const primaryDriver = await prisma.driver.findUnique({
        where: { id: primaryDriverId },
      });

      if (!primaryDriver) {
        return NextResponse.json(
          { error: "Primary driver not found" },
          { status: 404 }
        );
      }

      if (!primaryDriver.active) {
        return NextResponse.json(
          { error: "Primary driver is not active" },
          { status: 400 }
        );
      }

      // Check if primary driver is already assigned to another schedule at the same time
      const departureTimeToCheck = departureDate
        ? new Date(departureDate)
        : existingSchedule.departureDate;

      const arrivalTimeToCheck = estimatedArrivalTime
        ? new Date(estimatedArrivalTime)
        : existingSchedule.estimatedArrivalTime;

      const overlappingPrimaryDriverSchedule = await prisma.schedule.findFirst({
        where: {
          id: { not: id }, // Exclude current schedule
          OR: [
            {
              primaryDriverId,
              OR: [
                {
                  departureDate: {
                    lte: departureTimeToCheck,
                  },
                  estimatedArrivalTime: {
                    gte: departureTimeToCheck,
                  },
                },
                {
                  departureDate: {
                    lte: arrivalTimeToCheck,
                  },
                  estimatedArrivalTime: {
                    gte: arrivalTimeToCheck,
                  },
                },
                {
                  departureDate: {
                    gte: departureTimeToCheck,
                  },
                  estimatedArrivalTime: {
                    lte: arrivalTimeToCheck,
                  },
                },
              ],
            },
            {
              secondaryDriverId: primaryDriverId,
              OR: [
                {
                  departureDate: {
                    lte: departureTimeToCheck,
                  },
                  estimatedArrivalTime: {
                    gte: departureTimeToCheck,
                  },
                },
                {
                  departureDate: {
                    lte: arrivalTimeToCheck,
                  },
                  estimatedArrivalTime: {
                    gte: arrivalTimeToCheck,
                  },
                },
                {
                  departureDate: {
                    gte: departureTimeToCheck,
                  },
                  estimatedArrivalTime: {
                    lte: arrivalTimeToCheck,
                  },
                },
              ],
            },
          ],
          status: {
            in: ["scheduled", "in_progress"],
          },
        },
      });

      if (overlappingPrimaryDriverSchedule) {
        return NextResponse.json(
          {
            error:
              "Primary driver is already assigned to another schedule during this time period",
          },
          { status: 409 }
        );
      }
    }

    // If changing secondary driver, check if new driver exists and is available
    if (
      secondaryDriverId &&
      secondaryDriverId !== existingSchedule.secondaryDriverId
    ) {
      const secondaryDriver = await prisma.driver.findUnique({
        where: { id: secondaryDriverId },
      });

      if (!secondaryDriver) {
        return NextResponse.json(
          { error: "Secondary driver not found" },
          { status: 404 }
        );
      }

      if (!secondaryDriver.active) {
        return NextResponse.json(
          { error: "Secondary driver is not active" },
          { status: 400 }
        );
      }

      // Check if secondary driver is already assigned to another schedule at the same time
      const departureTimeToCheck = departureDate
        ? new Date(departureDate)
        : existingSchedule.departureDate;

      const arrivalTimeToCheck = estimatedArrivalTime
        ? new Date(estimatedArrivalTime)
        : existingSchedule.estimatedArrivalTime;

      const overlappingSecondaryDriverSchedule =
        await prisma.schedule.findFirst({
          where: {
            id: { not: id }, // Exclude current schedule
            OR: [
              {
                primaryDriverId: secondaryDriverId,
                OR: [
                  {
                    departureDate: {
                      lte: departureTimeToCheck,
                    },
                    estimatedArrivalTime: {
                      gte: departureTimeToCheck,
                    },
                  },
                  {
                    departureDate: {
                      lte: arrivalTimeToCheck,
                    },
                    estimatedArrivalTime: {
                      gte: arrivalTimeToCheck,
                    },
                  },
                ],
              },
              {
                secondaryDriverId,
                OR: [
                  {
                    departureDate: {
                      lte: departureTimeToCheck,
                    },
                    estimatedArrivalTime: {
                      gte: departureTimeToCheck,
                    },
                  },
                  {
                    departureDate: {
                      lte: arrivalTimeToCheck,
                    },
                    estimatedArrivalTime: {
                      gte: arrivalTimeToCheck,
                    },
                  },
                ],
              },
            ],
            status: {
              in: ["scheduled", "in_progress"],
            },
          },
        });

      if (overlappingSecondaryDriverSchedule) {
        return NextResponse.json(
          {
            error:
              "Secondary driver is already assigned to another schedule during this time period",
          },
          { status: 409 }
        );
      }
    }

    // Update schedule
    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        busId: busId !== undefined ? busId : undefined,
        departureDate:
          departureDate !== undefined ? new Date(departureDate) : undefined,
        estimatedArrivalTime:
          estimatedArrivalTime !== undefined
            ? new Date(estimatedArrivalTime)
            : undefined,
        actualDepartureTime:
          actualDepartureTime !== undefined
            ? new Date(actualDepartureTime)
            : undefined,
        actualArrivalTime:
          actualArrivalTime !== undefined
            ? new Date(actualArrivalTime)
            : undefined,
        price: price !== undefined ? price : undefined,
        status: status !== undefined ? (status as ScheduleStatus) : undefined,
        primaryDriverId:
          primaryDriverId !== undefined ? primaryDriverId : undefined,
        secondaryDriverId:
          secondaryDriverId !== undefined ? secondaryDriverId : undefined,
      },
      include: {
        bus: true,
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
        primaryDriver: true,
        secondaryDriver: true,
      },
    });

    // If bus changed, update bus assignment
    if (busId && busId !== existingSchedule.busId) {
      // Update existing bus assignment
      await prisma.busAssignment.updateMany({
        where: { scheduleId: id },
        data: {
          busId,
          startTime: departureDate
            ? new Date(departureDate)
            : existingSchedule.departureDate,
          endTime: estimatedArrivalTime
            ? new Date(estimatedArrivalTime)
            : existingSchedule.estimatedArrivalTime,
        },
      });
    }

    return NextResponse.json({ schedule: updatedSchedule });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Cancel a schedule
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        tickets: {
          where: {
            status: "active",
          },
        },
        parcels: {
          where: {
            status: {
              in: ["received", "in_transit"],
            },
          },
        },
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Check if schedule has active tickets or parcels
    if (
      existingSchedule.tickets.length > 0 ||
      existingSchedule.parcels.length > 0
    ) {
      return NextResponse.json(
        { error: "Cannot cancel schedule with active tickets or parcels" },
        { status: 400 }
      );
    }

    // Update schedule status to cancelled
    const cancelledSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        status: "cancelled",
      },
    });

    // Update bus assignment status to cancelled
    await prisma.busAssignment.updateMany({
      where: { scheduleId: id },
      data: {
        status: "cancelled",
      },
    });

    return NextResponse.json({
      message: "Schedule cancelled successfully",
      schedule: cancelledSchedule,
    });
  } catch (error) {
    console.error("Error cancelling schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
