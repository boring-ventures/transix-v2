import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MaintenanceStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// Get all buses for a specific company
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const maintenanceStatus = searchParams.get("maintenanceStatus");
    const templateId = searchParams.get("templateId");

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Build where clause
    const whereClause: Prisma.BusWhereInput = { companyId: id };
    if (isActive !== null) whereClause.isActive = isActive === "true";
    if (maintenanceStatus)
      whereClause.maintenanceStatus = maintenanceStatus as MaintenanceStatus;
    if (templateId) whereClause.templateId = templateId;

    // Get buses
    const buses = await prisma.bus.findMany({
      where: whereClause,
      include: {
        template: true,
        _count: {
          select: {
            busSeats: true,
          },
        },
      },
      orderBy: {
        plateNumber: "asc",
      },
    });

    return NextResponse.json({ buses });
  } catch (error) {
    console.error("Error fetching company buses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 