import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Create a new company
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { name, active } = json;

    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all companies with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const active = searchParams.get("active");
    
    const whereClause: Prisma.CompanyWhereInput = {};
    
    if (name) {
      whereClause.name = { contains: name, mode: 'insensitive' };
    }
    
    if (active !== null) {
      whereClause.active = active === "true";
    }
    
    const companies = await prisma.company.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 