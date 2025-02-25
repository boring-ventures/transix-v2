import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MaintenanceStatus } from "@prisma/client";

// Update the maintenance status of a bus
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    // Validate status
    if (!["active", "in_maintenance", "retired"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid maintenance status" },
        { status: 400 }
      );
    }

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

    // Update bus maintenance status
    const updatedBus = await prisma.bus.update({
      where: { id },
      data: {
        maintenanceStatus: status as MaintenanceStatus,
        // If status is "retired", set isActive to false
        isActive: status === "retired" ? false : existingBus.isActive,
      },
    });

    return NextResponse.json({ 
      message: "Bus maintenance status updated successfully",
      bus: updatedBus
    });
  } catch (error) {
    console.error("Error updating bus maintenance status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 