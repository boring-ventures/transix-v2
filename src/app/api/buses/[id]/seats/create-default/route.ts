import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SeatStatus } from "@prisma/client";

// Create default seats for a bus
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if bus exists
    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    if (!bus) {
      return NextResponse.json({ error: "Bus not found" }, { status: 404 });
    }

    // Check if bus already has seats
    const existingSeats = await prisma.busSeat.count({
      where: { busId: id },
    });

    if (existingSeats > 0) {
      return NextResponse.json(
        { message: "Bus already has seats", count: existingSeats },
        { status: 200 }
      );
    }

    // Get default tier
    const defaultTier = await prisma.seatTier.findFirst({
      where: { isActive: true },
    });

    if (!defaultTier) {
      return NextResponse.json(
        { error: "No active seat tiers found" },
        { status: 400 }
      );
    }

    // Create default seats based on template
    const rows = 10;
    const cols = 4;
    const seatData = [];

    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        const seatNumber = `${row}${String.fromCharCode(64 + col)}`;

        seatData.push({
          busId: id,
          seatNumber,
          tierId: defaultTier.id,
          status: SeatStatus.available,
          isActive: true,
        });
      }
    }

    // Create seats
    const createdSeats = await prisma.busSeat.createMany({
      data: seatData,
    });

    return NextResponse.json({
      message: "Default seats created successfully",
      count: createdSeats.count,
    });
  } catch (error) {
    console.error("Error creating default seats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
