import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ScheduleStatus } from "@prisma/client";

// Update the status of a schedule
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, actualDepartureTime, actualArrivalTime } =
      await request.json();

    // Validate status
    if (
      ![
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "delayed",
      ].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid schedule status" },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Validate status transitions
    if (existingSchedule.status === "cancelled" && status !== "cancelled") {
      return NextResponse.json(
        { error: "Cannot change status of a cancelled schedule" },
        { status: 400 }
      );
    }

    if (existingSchedule.status === "completed" && status !== "completed") {
      return NextResponse.json(
        { error: "Cannot change status of a completed schedule" },
        { status: 400 }
      );
    }

    // Prepare update data
    interface ScheduleStatusUpdate {
      status: ScheduleStatus;
      actualDepartureTime?: string | Date;
      actualArrivalTime?: string | Date;
    }

    const updateData: ScheduleStatusUpdate = {
      status: status as ScheduleStatus,
    };

    // Add actual departure time if provided or if status is changing to in_progress
    if (actualDepartureTime) {
      updateData.actualDepartureTime = new Date(actualDepartureTime);
    } else if (
      status === "in_progress" &&
      !existingSchedule.actualDepartureTime
    ) {
      updateData.actualDepartureTime = new Date();
    }

    // Add actual arrival time if provided or if status is changing to completed
    if (actualArrivalTime) {
      updateData.actualArrivalTime = new Date(actualArrivalTime);
    } else if (status === "completed" && !existingSchedule.actualArrivalTime) {
      updateData.actualArrivalTime = new Date();
    }

    // Update schedule
    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
    });

    // If status is changing to cancelled, update bus assignment
    if (status === "cancelled" && existingSchedule.status !== "cancelled") {
      await prisma.busAssignment.updateMany({
        where: { scheduleId: id },
        data: {
          status: "cancelled",
        },
      });
    }

    // If status is changing to completed, update bus assignment
    if (status === "completed" && existingSchedule.status !== "completed") {
      await prisma.busAssignment.updateMany({
        where: { scheduleId: id },
        data: {
          status: "completed",
        },
      });
    }

    // Create bus log for departure
    if (status === "in_progress" && existingSchedule.status !== "in_progress") {
      // Get route origin location
      const routeInfo = await prisma.routeSchedule.findUnique({
        where: { id: existingSchedule.routeScheduleId },
        include: {
          route: {
            include: {
              origin: true,
            },
          },
        },
      });

      if (routeInfo) {
        await prisma.busLog.create({
          data: {
            scheduleId: id,
            eventType: "departure",
            locationId: routeInfo.route.originId,
          },
        });
      }
    }

    // Create bus log for arrival
    if (status === "completed" && existingSchedule.status !== "completed") {
      // Get route destination location
      const routeInfo = await prisma.routeSchedule.findUnique({
        where: { id: existingSchedule.routeScheduleId },
        include: {
          route: {
            include: {
              destination: true,
            },
          },
        },
      });

      if (routeInfo) {
        await prisma.busLog.create({
          data: {
            scheduleId: id,
            eventType: "arrival",
            locationId: routeInfo.route.destinationId,
          },
        });
      }
    }

    return NextResponse.json({
      message: "Schedule status updated successfully",
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Error updating schedule status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
