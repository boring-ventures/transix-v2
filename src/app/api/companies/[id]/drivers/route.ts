import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
// Get all drivers for a specific company
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const licenseCategory = searchParams.get("licenseCategory");
    
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });
    
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    // Build where clause
    const whereClause: Prisma.DriverWhereInput = { companyId: id };
    if (active !== null) whereClause.active = active === "true";
    if (licenseCategory) whereClause.licenseCategory = licenseCategory;
    
    // Get drivers
    const drivers = await prisma.driver.findMany({
      where: whereClause,
      orderBy: {
        fullName: "asc",
      },
    });
    
    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Error fetching company drivers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new driver for a specific company
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const json = await request.json();
    const { fullName, documentId, licenseNumber, licenseCategory, active } = json;
    
    if (!fullName || !documentId || !licenseNumber || !licenseCategory) {
      return NextResponse.json(
        { error: "Missing required driver information" },
        { status: 400 }
      );
    }
    
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });
    
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    // Check if driver with same document ID already exists
    const existingDriver = await prisma.driver.findFirst({
      where: { documentId },
    });
    
    if (existingDriver) {
      return NextResponse.json(
        { error: "Driver with this document ID already exists" },
        { status: 409 }
      );
    }
    
    // Create driver
    const driver = await prisma.driver.create({
      data: {
        companyId: id,
        fullName,
        documentId,
        licenseNumber,
        licenseCategory,
        active: active !== undefined ? active : true,
      },
    });
    
    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 