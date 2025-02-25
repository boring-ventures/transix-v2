import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all tickets for a schedule
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

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

    // Build where clause
    const whereClause = {
      scheduleId: id,
      ...(status ? { status } : {}),
    };

    // Get tickets
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        customer: true,
        busSeat: {
          include: {
            tier: true,
          },
        },
        profile: true,
      },
      orderBy: {
        purchasedAt: "desc",
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching schedule tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new ticket for a schedule
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      customerId,
      busSeatId,
      price,
      purchasedBy,
      notes,
    } = await request.json();

    // Validate required fields
    if (!busSeatId) {
      return NextResponse.json(
        { error: "Bus seat ID is required" },
        { status: 400 }
      );
    }

    // Check if schedule exists and is not cancelled or completed
    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    if (schedule.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot create ticket for a cancelled schedule" },
        { status: 400 }
      );
    }

    if (schedule.status === "completed") {
      return NextResponse.json(
        { error: "Cannot create ticket for a completed schedule" },
        { status: 400 }
      );
    }

    // Check if bus seat exists and belongs to the schedule's bus
    const busSeat = await prisma.busSeat.findUnique({
      where: { id: busSeatId },
    });

    if (!busSeat) {
      return NextResponse.json(
        { error: "Bus seat not found" },
        { status: 404 }
      );
    }

    if (busSeat.busId !== schedule.busId) {
      return NextResponse.json(
        { error: "Bus seat does not belong to the schedule's bus" },
        { status: 400 }
      );
    }

    // Check if seat is already taken for this schedule
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        scheduleId: id,
        busSeatId,
        status: "active",
      },
    });

    if (existingTicket) {
      return NextResponse.json(
        { error: "This seat is already booked for this schedule" },
        { status: 409 }
      );
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        scheduleId: id,
        customerId,
        busSeatId,
        price: price || schedule.price,
        purchasedBy,
        notes,
        status: "active",
      },
      include: {
        customer: true,
        busSeat: {
          include: {
            tier: true,
          },
        },
        schedule: {
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
        },
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 