import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get occupancy logs for a schedule
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Get occupancy logs
    const occupancyLogs = await prisma.occupancyLog.findMany({
      where: { scheduleId: id },
      orderBy: {
        recordedAt: "desc",
      },
    });

    return NextResponse.json({ occupancyLogs });
  } catch (error) {
    console.error("Error fetching occupancy logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new occupancy log
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { passengerCount, recordedAt, notes } = await request.json();

    // Validate required fields
    if (passengerCount === undefined) {
      return NextResponse.json(
        { error: "Passenger count is required" },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Create occupancy log
    const occupancyLog = await prisma.occupancyLog.create({
      data: {
        scheduleId: id,
        passengerCount,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        notes,
      },
    });

    return NextResponse.json({ occupancyLog }, { status: 201 });
  } catch (error) {
    console.error("Error creating occupancy log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 