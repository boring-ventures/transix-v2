import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { BusSeat } from "@prisma/client";

// Get all seats for a specific bus
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if bus exists
    const bus = await prisma.bus.findUnique({
      where: { id },
    });

    if (!bus) {
      return NextResponse.json(
        { error: "Bus not found" },
        { status: 404 }
      );
    }

    // Get all seats for the bus
    const seats = await prisma.busSeat.findMany({
      where: { busId: id },
      include: {
        tier: true,
      },
      orderBy: {
        seatNumber: "asc",
      },
    });

    return NextResponse.json({ seats });
  } catch (error) {
    console.error("Error fetching bus seats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create or update seats for a bus
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { seats } = await request.json();

    // Check if bus exists
    const bus = await prisma.bus.findUnique({
      where: { id },
    });

    if (!bus) {
      return NextResponse.json(
        { error: "Bus not found" },
        { status: 404 }
      );
    }

    // Log the incoming seats data for debugging
    console.log("Updating seats with data:", JSON.stringify(seats, null, 2));

    // Delete existing seats
    await prisma.busSeat.deleteMany({
      where: { busId: id },
    });

    // Create new seats
    const createdSeats = await prisma.busSeat.createMany({
      data: seats.map((seat: BusSeat) => {
        // Ensure we're using valid status values
        const status = seat.isActive ? "available" : "maintenance";
        
        return {
          busId: id,
          seatNumber: seat.seatNumber,
          tierId: seat.tierId,
          status: seat.status || status,
          isActive: seat.isActive !== undefined ? seat.isActive : true,
        };
      }),
    });

    // Fetch the updated seats to return
    const updatedSeats = await prisma.busSeat.findMany({
      where: { busId: id },
      include: { tier: true },
    });

    return NextResponse.json({ 
      message: "Bus seats updated successfully",
      count: createdSeats.count,
      seats: updatedSeats
    });
  } catch (error) {
    console.error("Error updating bus seats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 