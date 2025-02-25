import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific bus by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        company: true,
        template: true,
        busSeats: {
          include: {
            tier: true,
          },
          orderBy: {
            seatNumber: "asc",
          },
        },
        _count: {
          select: {
            assignments: true,
            schedules: true,
          },
        },
      },
    });

    if (!bus) {
      return NextResponse.json(
        { error: "Bus not found" },
        { status: 404 }
      );
    }

    // Parse JSON strings back to objects
    const parsedBus = {
      ...bus,
      seatMatrix: JSON.parse(bus.seatMatrix as string),
    };

    return NextResponse.json({ bus: parsedBus });
  } catch (error) {
    console.error("Error fetching bus:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a bus
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { plateNumber, isActive, seatMatrix, maintenanceStatus, templateId } = json;

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { id },
    });

    if (!existingBus) {
      return NextResponse.json(
        { error: "Bus not found" },
        { status: 404 }
      );
    }

    // If updating plate number, check if it's already in use
    if (plateNumber && plateNumber !== existingBus.plateNumber) {
      const busWithPlateNumber = await prisma.bus.findUnique({
        where: { plateNumber },
      });

      if (busWithPlateNumber) {
        return NextResponse.json(
          { error: "A bus with this plate number already exists" },
          { status: 400 }
        );
      }
    }

    // Update bus
    const updatedBus = await prisma.bus.update({
      where: { id },
      data: {
        plateNumber: plateNumber !== undefined ? plateNumber : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        seatMatrix: seatMatrix !== undefined ? JSON.stringify(seatMatrix) : undefined,
        maintenanceStatus: maintenanceStatus !== undefined ? maintenanceStatus : undefined,
        templateId: templateId !== undefined ? templateId : undefined,
      },
      include: {
        company: true,
        template: true,
      },
    });

    // Parse JSON strings back to objects
    const parsedBus = {
      ...updatedBus,
      seatMatrix: JSON.parse(updatedBus.seatMatrix as string),
    };

    return NextResponse.json({ bus: parsedBus });
  } catch (error) {
    console.error("Error updating bus:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a bus
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
            schedules: true,
          },
        },
      },
    });

    if (!existingBus) {
      return NextResponse.json(
        { error: "Bus not found" },
        { status: 404 }
      );
    }

    // Check if bus has associated assignments or schedules
    if (existingBus._count.assignments > 0 || existingBus._count.schedules > 0) {
      return NextResponse.json(
        { error: "Cannot delete bus with associated assignments or schedules" },
        { status: 400 }
      );
    }

    // Delete bus seats first
    await prisma.busSeat.deleteMany({
      where: { busId: id },
    });

    // Delete bus
    await prisma.bus.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bus deleted successfully" });
  } catch (error) {
    console.error("Error deleting bus:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 