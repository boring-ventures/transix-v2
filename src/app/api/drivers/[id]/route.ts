import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific driver by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        company: true,
        _count: {
          select: {
            primarySchedules: true,
            secondarySchedules: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a driver
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const { fullName, documentId, licenseNumber, licenseCategory, companyId, active } = json;

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // If companyId is provided, check if it exists
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }
    }

    // If documentId is changed, check if it's unique
    if (documentId && documentId !== existingDriver.documentId) {
      const driverWithSameDocument = await prisma.driver.findFirst({
        where: { 
          documentId,
          id: { not: id } // Exclude current driver
        },
      });

      if (driverWithSameDocument) {
        return NextResponse.json(
          { error: "Document ID already in use by another driver" },
          { status: 409 }
        );
      }
    }

    // Update driver
    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        fullName: fullName !== undefined ? fullName : undefined,
        documentId: documentId !== undefined ? documentId : undefined,
        licenseNumber: licenseNumber !== undefined ? licenseNumber : undefined,
        licenseCategory: licenseCategory !== undefined ? licenseCategory : undefined,
        companyId: companyId !== undefined ? companyId : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    return NextResponse.json({
      message: "Driver updated successfully",
      driver: updatedDriver,
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a driver (soft delete by setting active to false)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Check if driver is assigned to any schedules
    const assignedSchedules = await prisma.schedule.count({
      where: {
        OR: [
          { primaryDriverId: id },
          { secondaryDriverId: id }
        ]
      }
    });

    if (assignedSchedules > 0) {
      return NextResponse.json(
        { error: "Cannot delete driver assigned to schedules" },
        { status: 400 }
      );
    }

    // Instead of deleting, mark as inactive
    const deactivatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        active: false,
      },
    });

    return NextResponse.json({
      message: "Driver deactivated successfully",
      driver: deactivatedDriver,
    });
  } catch (error) {
    console.error("Error deactivating driver:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 