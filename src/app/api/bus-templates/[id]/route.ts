import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific bus template by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.busTypeTemplate.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Bus template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching bus template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a bus template
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { name, description, totalCapacity, seatTemplateMatrix, isActive, type, seatsLayout } = json;

    // Check if template exists
    const existingTemplate = await prisma.busTypeTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Bus template not found" },
        { status: 404 }
      );
    }

    // Update template
    const updatedTemplate = await prisma.busTypeTemplate.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        totalCapacity: totalCapacity !== undefined ? totalCapacity : undefined,
        seatTemplateMatrix: seatTemplateMatrix !== undefined ? seatTemplateMatrix : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        type: type !== undefined ? type : undefined,
        seatsLayout: seatsLayout !== undefined ? seatsLayout : undefined,
      },
    });

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error("Error updating bus template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a bus template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if template exists
    const existingTemplate = await prisma.busTypeTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            buses: true,
          },
        },
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Bus template not found" },
        { status: 404 }
      );
    }

    // Check if template has associated buses
    if (existingTemplate._count.buses > 0) {
      return NextResponse.json(
        { error: "Cannot delete template with associated buses" },
        { status: 400 }
      );
    }

    // Delete template
    await prisma.busTypeTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bus template deleted successfully" });
  } catch (error) {
    console.error("Error deleting bus template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 