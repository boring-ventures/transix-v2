import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific route by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        origin: true,
        destination: true,
        _count: {
          select: {
            assignments: true,
            routeSchedules: true,
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { message: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ route });
  } catch (error) {
    console.error("Error al obtener la ruta:", error);
    return NextResponse.json(
      { message: "Error al obtener la ruta" },
      { status: 500 }
    );
  }
}

// Update a route
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeId = (await params).id;
    const data = await req.json();
    const { name, originId, destinationId, estimatedDuration, departureLane, active } = data;

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!existingRoute) {
      return NextResponse.json(
        { message: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!name || !originId || !destinationId || !estimatedDuration) {
      return NextResponse.json(
        { message: "Nombre, origen, destino y duración estimada son requeridos" },
        { status: 400 }
      );
    }

    // Check if origin and destination exist
    const [origin, destination] = await Promise.all([
      prisma.location.findUnique({ where: { id: originId } }),
      prisma.location.findUnique({ where: { id: destinationId } })
    ]);

    if (!origin || !destination) {
      return NextResponse.json(
        { message: "Ubicación de origen o destino no encontrada" },
        { status: 404 }
      );
    }

    // Update route
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: {
        name,
        originId,
        destinationId,
        estimatedDuration,
        departureLane: departureLane || "",
        active,
      },
    });

    return NextResponse.json({
      message: "Ruta actualizada exitosamente",
      route: updatedRoute,
    });
  } catch (error) {
    console.error("Error al actualizar la ruta:", error);
    return NextResponse.json(
      { message: "Error al actualizar la ruta" },
      { status: 500 }
    );
  }
}

// Delete a route
export async function DELETE(
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
            assignments: true,
            routeSchedules: true,
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

    // Check if route has related entities
    const hasRelatedEntities =
      existingRoute._count.assignments > 0 ||
      existingRoute._count.routeSchedules > 0;

    if (hasRelatedEntities) {
      return NextResponse.json(
        {
          message:
            "No se puede eliminar la ruta porque está siendo utilizada. Desactive o elimine primero las entidades relacionadas.",
        },
        { status: 400 }
      );
    }

    // Delete the route
    await prisma.route.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Ruta eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar la ruta:", error);
    return NextResponse.json(
      { message: "Error al eliminar la ruta" },
      { status: 500 }
    );
  }
} 