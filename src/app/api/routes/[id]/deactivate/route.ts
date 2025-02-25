import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: {
              where: { status: "active" },
            },
            routeSchedules: {
              where: { active: true },
            },
          },
        },
      },
    });

    if (!existingRoute) {
      return NextResponse.json(
        { message: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    // Check if route has active related entities
    const hasActiveEntities =
      existingRoute._count.assignments > 0 ||
      existingRoute._count.routeSchedules > 0;

    if (hasActiveEntities) {
      return NextResponse.json(
        {
          message:
            "No se puede desactivar la ruta porque está siendo utilizada en asignaciones o horarios activos. Desactive primero las entidades relacionadas.",
        },
        { status: 400 }
      );
    }

    // Update route to inactive
    const updatedRoute = await prisma.route.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({
      message: "Ruta desactivada exitosamente",
      route: updatedRoute,
    });
  } catch (error) {
    console.error("Error al desactivar la ruta:", error);
    return NextResponse.json(
      { message: "Error al desactivar la ruta" },
      { status: 500 }
    );
  }
} 