import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Update driver with company assignment
    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        companyId,
      },
    });

    return NextResponse.json({
      message: "Company assigned successfully",
      driver: updatedDriver,
    });
  } catch (error) {
    console.error("Error assigning company to driver:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 