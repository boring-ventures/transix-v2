import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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
            originRoutes: {
              where: { active: true },
            },
            destinationRoutes: {
              where: { active: true },
            },
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

    // Check if location has active related routes
    const hasActiveRoutes =
      existingLocation._count.originRoutes > 0 ||
      existingLocation._count.destinationRoutes > 0;

    if (hasActiveRoutes) {
      return NextResponse.json(
        {
          message:
            "No se puede desactivar la ubicación porque está siendo utilizada en rutas activas. Desactive primero las rutas relacionadas.",
        },
        { status: 400 }
      );
    }

    // Update location to inactive
    const updatedLocation = await prisma.location.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({
      message: "Ubicación desactivada exitosamente",
      location: updatedLocation,
    });
  } catch (error) {
    console.error("Error al desactivar la ubicación:", error);
    return NextResponse.json(
      { message: "Error al desactivar la ubicación" },
      { status: 500 }
    );
  }
} 