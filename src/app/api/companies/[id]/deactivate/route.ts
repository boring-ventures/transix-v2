import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            branches: {
              where: { active: true },
            },
            profiles: {
              where: { active: true },
            },
            buses: {
              where: { isActive: true },
            },
            drivers: {
              where: { active: true },
            },
          },
        },
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Check if company has active related entities
    const hasActiveEntities =
      existingCompany._count.branches > 0 ||
      existingCompany._count.profiles > 0 ||
      existingCompany._count.buses > 0 ||
      existingCompany._count.drivers > 0;

    if (hasActiveEntities) {
      return NextResponse.json(
        {
          message:
            "No se puede desactivar la empresa porque tiene elementos activos asociados. Desactive primero todas las sucursales, perfiles, buses y conductores.",
        },
        { status: 400 }
      );
    }

    // Update company to inactive
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({
      message: "Empresa desactivada exitosamente",
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Error al desactivar la empresa:", error);
    return NextResponse.json(
      { message: "Error al desactivar la empresa" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
