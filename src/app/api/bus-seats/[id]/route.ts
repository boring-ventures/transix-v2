import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific bus seat by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const busSeat = await prisma.busSeat.findUnique({
      where: { id },
      include: {
        tier: true,
        bus: true,
      },
    });

    if (!busSeat) {
      return NextResponse.json(
        { error: "Bus seat not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ busSeat });
  } catch (error) {
    console.error("Error fetching bus seat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a bus seat
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { tierId, status, isActive } = json;

    // Check if bus seat exists
    const existingBusSeat = await prisma.busSeat.findUnique({
      where: { id },
    });

    if (!existingBusSeat) {
      return NextResponse.json(
        { error: "Bus seat not found" },
        { status: 404 }
      );
    }

    // If changing tier, check if tier exists
    if (tierId) {
      const seatTier = await prisma.seatTier.findUnique({
        where: { id: tierId },
      });
      
      if (!seatTier) {
        return NextResponse.json(
          { error: "Seat tier not found" },
          { status: 404 }
        );
      }
    }

    // Update bus seat
    const updatedBusSeat = await prisma.busSeat.update({
      where: { id },
      data: {
        tierId: tierId !== undefined ? tierId : undefined,
        status: status !== undefined ? status : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        tier: true,
        bus: true,
      },
    });

    return NextResponse.json({ busSeat: updatedBusSeat });
  } catch (error) {
    console.error("Error updating bus seat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a bus seat
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if bus seat exists
    const existingBusSeat = await prisma.busSeat.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!existingBusSeat) {
      return NextResponse.json(
        { error: "Bus seat not found" },
        { status: 404 }
      );
    }

    // Check if bus seat has associated tickets
    if (existingBusSeat._count.tickets > 0) {
      return NextResponse.json(
        { error: "Cannot delete bus seat with associated tickets" },
        { status: 400 }
      );
    }

    // Delete bus seat
    await prisma.busSeat.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bus seat deleted successfully" });
  } catch (error) {
    console.error("Error deleting bus seat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 