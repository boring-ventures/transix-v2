import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Get all bus templates with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const isActive = searchParams.get("isActive");
    const companyId = searchParams.get("companyId");
    const type = searchParams.get("type");
    
    const whereClause: Prisma.BusTypeTemplateWhereInput = {};
    
    if (name) {
      whereClause.name = { contains: name, mode: 'insensitive' };
    }
    
    if (isActive !== null) {
      whereClause.isActive = isActive === "true";
    }
    
    if (companyId) {
      whereClause.companyId = companyId;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    const templates = await prisma.busTypeTemplate.findMany({
      where: whereClause,
      include: {
        company: true,
        _count: {
          select: {
            buses: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching bus templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new bus template
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { 
      name, 
      description, 
      companyId, 
      totalCapacity, 
      seatTemplateMatrix, 
      isActive,
      type,
      seatsLayout
    } = json;
    
    if (!name || !companyId || !totalCapacity || !seatTemplateMatrix || !type || !seatsLayout) {
      return NextResponse.json(
        { error: "Missing required template information" },
        { status: 400 }
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
    
    // Create template
    const template = await prisma.busTypeTemplate.create({
      data: {
        name,
        description,
        companyId,
        totalCapacity,
        seatTemplateMatrix,
        isActive: isActive !== undefined ? isActive : true,
        type,
        seatsLayout,
      },
      include: {
        company: true,
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