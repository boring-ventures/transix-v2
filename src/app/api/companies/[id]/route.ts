import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get a specific company by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        branches: true,
        _count: {
          select: {
            profiles: true,
            buses: true,
            drivers: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Error al obtener la empresa:", error);
    return NextResponse.json(
      { message: "Error al obtener la empresa" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update a company
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = (await params).id;
    const data = await req.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { message: "El nombre de la empresa es requerido" },
        { status: 400 }
      );
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        active: data.active,
      },
    });

    return NextResponse.json({
      message: "Empresa actualizada exitosamente",
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Error al actualizar la empresa:", error);
    return NextResponse.json(
      { message: "Error al actualizar la empresa" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a company
export async function DELETE(
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
            branches: true,
            profiles: true,
            buses: true,
            drivers: true,
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

    // Check if company has related entities
    const hasRelatedEntities =
      existingCompany._count.branches > 0 ||
      existingCompany._count.profiles > 0 ||
      existingCompany._count.buses > 0 ||
      existingCompany._count.drivers > 0;

    if (hasRelatedEntities) {
      return NextResponse.json(
        {
          message:
            "No se puede eliminar la empresa porque tiene elementos asociados. Elimine primero todas las sucursales, perfiles, buses y conductores.",
        },
        { status: 400 }
      );
    }

    // Delete the company
    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Empresa eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar la empresa:", error);
    return NextResponse.json(
      { message: "Error al eliminar la empresa" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 