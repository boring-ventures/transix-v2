import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PassengerStatus } from "@prisma/client";

// Get passenger list for a schedule
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
      ...(status ? { status: status as PassengerStatus } : {}),
    };

    // Get passenger list
    const passengerList = await prisma.passengerList.findMany({
      where: whereClause,
      orderBy: {
        seatNumber: "asc",
      },
    });

    return NextResponse.json({ passengerList });
  } catch (error) {
    console.error("Error fetching passenger list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Generate passenger list from tickets
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        tickets: {
          where: {
            status: "active",
          },
          include: {
            customer: true,
            busSeat: true,
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

    // Delete existing passenger list
    await prisma.passengerList.deleteMany({
      where: { scheduleId: id },
    });

    // Generate passenger list from tickets
    const passengerListData = schedule.tickets.map(ticket => ({
      scheduleId: id,
      documentId: ticket.customer?.documentId || null,
      fullName: ticket.customer?.fullName || "Unknown",
      seatNumber: ticket.busSeat.seatNumber,
      status: "confirmed" as PassengerStatus,
    }));

    // Create passenger list entries
    const passengerList = await prisma.passengerList.createMany({
      data: passengerListData,
    });

    return NextResponse.json({
      message: "Passenger list generated successfully",
      count: passengerList.count,
    });
  } catch (error) {
    console.error("Error generating passenger list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 