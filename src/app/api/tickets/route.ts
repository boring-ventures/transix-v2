import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, TicketStatus } from "@prisma/client";

// Get all tickets with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const purchasedBy = searchParams.get("purchasedBy");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = Number(searchParams.get("page")) || 1;
    const perPage = Number(searchParams.get("perPage")) || 10;

    // Build where clause
    const whereClause: Prisma.TicketWhereInput = {};

    if (scheduleId) whereClause.scheduleId = scheduleId;
    if (customerId) whereClause.customerId = customerId;
    if (status) whereClause.status = status as TicketStatus;
    if (purchasedBy) whereClause.purchasedBy = purchasedBy;

    // Apply date filters if provided
    if (startDate || endDate) {
      whereClause.purchasedAt = {};

      if (startDate) {
        whereClause.purchasedAt.gte = new Date(startDate);
      }

      if (endDate) {
        whereClause.purchasedAt.lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const total = await prisma.ticket.count({
      where: whereClause,
    });

    // Calculate pagination
    const skip = (page - 1) * perPage;

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
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
            bus: true,
          },
        },
        customer: true,
        busSeat: {
          include: {
            tier: true,
          },
        },
        profile: true,
        _count: {
          select: {
            paymentLines: true,
            cancellations: true,
            reassignments: true,
          },
        },
      },
      orderBy: {
        purchasedAt: "desc",
      },
      skip,
      take: perPage,
    });

    return NextResponse.json({
      tickets,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new ticket
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { scheduleId, customerId, busSeatId, price, purchasedBy, notes } =
      json;

    // Validate required fields
    if (!scheduleId || !busSeatId || price === undefined) {
      return NextResponse.json(
        { error: "Missing required ticket information" },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Check if bus seat exists
    const busSeat = await prisma.busSeat.findUnique({
      where: { id: busSeatId },
    });

    if (!busSeat) {
      return NextResponse.json(
        { error: "Bus seat not found" },
        { status: 404 }
      );
    }

    // Check if customer exists if customerId is provided
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }
    }

    // Check if profile exists if purchasedBy is provided
    if (purchasedBy) {
      const profile = await prisma.profile.findUnique({
        where: { id: purchasedBy },
      });

      if (!profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
    }

    // Check if seat is already booked for this schedule
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        scheduleId,
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
        scheduleId,
        customerId,
        busSeatId,
        status: "active",
        price,
        purchasedBy,
        notes,
      },
      include: {
        schedule: true,
        customer: true,
        busSeat: {
          include: {
            tier: true,
          },
        },
        profile: true,
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
