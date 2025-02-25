import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific location by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            originRoutes: true,
            destinationRoutes: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { message: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ location });
  } catch (error) {
    console.error("Error al obtener la ubicación:", error);
    return NextResponse.json(
      { message: "Error al obtener la ubicación" },
      { status: 500 }
    );
  }
}

// Update a location
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const locationId = (await params).id;
    const data = await req.json();

    // Validate required fields
    if (!data.name || !data.city || !data.type) {
      return NextResponse.json(
        { message: "Nombre, ciudad y tipo son requeridos" },
        { status: 400 }
      );
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { message: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    // Update location
    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        type: data.type,
        active: data.active,
      },
    });

    return NextResponse.json({
      message: "Ubicación actualizada exitosamente",
      location: updatedLocation,
    });
  } catch (error) {
    console.error("Error al actualizar la ubicación:", error);
    return NextResponse.json(
      { message: "Error al actualizar la ubicación" },
      { status: 500 }
    );
  }
}

// Delete a location
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            originRoutes: true,
            destinationRoutes: true,
          },
        },
      },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { message: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    // Check if location has related routes
    const hasRelatedRoutes =
      existingLocation._count.originRoutes > 0 ||
      existingLocation._count.destinationRoutes > 0;

    if (hasRelatedRoutes) {
      return NextResponse.json(
        {
          message:
            "No se puede eliminar la ubicación porque está siendo utilizada en rutas. Desactive o elimine primero las rutas relacionadas.",
        },
        { status: 400 }
      );
    }

    // Delete the location
    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Ubicación eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar la ubicación:", error);
    return NextResponse.json(
      { message: "Error al eliminar la ubicación" },
      { status: 500 }
    );
  }
} 