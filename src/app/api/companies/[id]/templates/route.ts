import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
// Get all bus templates for a specific company
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type");

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Build where clause
    const whereClause: Prisma.BusTypeTemplateWhereInput = { companyId: id };
    if (isActive !== null) whereClause.isActive = isActive === "true";
    if (type) whereClause.type = type;

    // Get templates
    const templates = await prisma.busTypeTemplate.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching company bus templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new bus template for a specific company
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { 
      name, 
      description, 
      totalCapacity, 
      seatTemplateMatrix, 
      isActive,
      type,
      seatsLayout
    } = json;
    
    if (!name || !totalCapacity || !seatTemplateMatrix || !type || !seatsLayout) {
      return NextResponse.json(
        { error: "Missing required template information" },
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
    
    // Create template
    const template = await prisma.busTypeTemplate.create({
      data: {
        companyId: id,
        name,
        description,
        totalCapacity,
        seatTemplateMatrix,
        isActive: isActive !== undefined ? isActive : true,
        type,
        seatsLayout,
      },
    });
    
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating bus template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 