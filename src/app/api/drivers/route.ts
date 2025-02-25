import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Create a new driver
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const {
      fullName,
      documentId,
      licenseNumber,
      licenseCategory,
      companyId,
      active,
    } = json;

    // Validate required fields
    if (
      !fullName ||
      !documentId ||
      !licenseNumber ||
      !licenseCategory ||
      !companyId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if driver with the same document ID already exists
    const existingDriver = await prisma.driver.findFirst({
      where: { documentId },
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: "Driver with this document ID already exists" },
        { status: 409 }
      );
    }

    // Create the driver
    const driver = await prisma.driver.create({
      data: {
        fullName,
        documentId,
        licenseNumber,
        licenseCategory,
        companyId,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json({
      message: "Driver created successfully",
      driver,
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all drivers with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const active = searchParams.get("active");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const whereClause: Prisma.DriverWhereInput = {};

    if (companyId) {
      whereClause.companyId = companyId;
    }

    if (!includeInactive) {
      whereClause.active = active !== "false";
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      include: {
        company: true,
        _count: {
          select: {
            primarySchedules: true,
            secondarySchedules: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
