import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get counts of related entities
    const [
      branchesCount,
      profilesCount,
      busesCount,
      driversCount,
      templatesCount,
      seatTiersCount,
      activeBusesCount,
    ] = await prisma.$transaction([
      prisma.branch.count({ where: { companyId: id } }),
      prisma.profile.count({ where: { companyId: id } }),
      prisma.bus.count({ where: { companyId: id } }),
      prisma.driver.count({ where: { companyId: id } }),
      prisma.busTypeTemplate.count({ where: { companyId: id } }),
      prisma.seatTier.count({ where: { companyId: id } }),
      prisma.bus.count({ where: { companyId: id, isActive: true } }),
    ]);

    // Get statistics
    const stats = {
      branchesCount,
      profilesCount,
      busesCount,
      driversCount,
      templatesCount,
      seatTiersCount,
      activeBusesCount,
      inactiveBusesCount: busesCount - activeBusesCount,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching company statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 