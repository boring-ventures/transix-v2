import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific company by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ company });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a company
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const json = await request.json();
    const { name, active } = json;
    
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });
    
    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        active: active !== undefined ? active : undefined,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ company: updatedCompany });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a company
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });
    
    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    // Check for related records
    const relatedRecordsCount = await prisma.$transaction([
      prisma.branch.count({ where: { companyId: id } }),
      prisma.profile.count({ where: { companyId: id } }),
      prisma.bus.count({ where: { companyId: id } }),
      prisma.driver.count({ where: { companyId: id } }),
    ]);
    
    const totalRelatedRecords = relatedRecordsCount.reduce((sum, count) => sum + count, 0);
    
    if (totalRelatedRecords > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete company with related records",
          details: "This company has associated branches, profiles, buses, or drivers"
        },
        { status: 409 }
      );
    }
    
    // Delete the company
    await prisma.company.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 