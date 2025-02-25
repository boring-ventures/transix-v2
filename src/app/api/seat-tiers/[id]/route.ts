import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific seat tier by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const seatTier = await prisma.seatTier.findUnique({
      where: { id },
      include: {
        company: true,
        _count: {
          select: {
            busSeats: true,
          },
        },
      },
    });

    if (!seatTier) {
      return NextResponse.json(
        { error: "Seat tier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ seatTier });
  } catch (error) {
    console.error("Error fetching seat tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a seat tier
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { name, description, basePrice, isActive } = json;

    // Check if seat tier exists
    const existingSeatTier = await prisma.seatTier.findUnique({
      where: { id },
    });

    if (!existingSeatTier) {
      return NextResponse.json(
        { error: "Seat tier not found" },
        { status: 404 }
      );
    }

    // Update seat tier
    const updatedSeatTier = await prisma.seatTier.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        basePrice: basePrice !== undefined ? basePrice : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return NextResponse.json({ seatTier: updatedSeatTier });
  } catch (error) {
    console.error("Error updating seat tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a seat tier
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if seat tier exists
    const existingSeatTier = await prisma.seatTier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            busSeats: true,
          },
        },
      },
    });

    if (!existingSeatTier) {
      return NextResponse.json(
        { error: "Seat tier not found" },
        { status: 404 }
      );
    }

    // Check if seat tier has associated bus seats
    if (existingSeatTier._count.busSeats > 0) {
      return NextResponse.json(
        { error: "Cannot delete seat tier with associated bus seats" },
        { status: 400 }
      );
    }

    // Delete seat tier
    await prisma.seatTier.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Seat tier deleted successfully" });
  } catch (error) {
    console.error("Error deleting seat tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 