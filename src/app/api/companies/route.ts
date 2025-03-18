import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoleProtection } from "@/lib/api-auth";

// Only superadmin can access companies API
const getCompanies = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const companies = await prisma.company.findMany({
      where: {
        active: active ? active === "true" : undefined,
      },
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
};

// Apply role protection to the handler
export const GET = withRoleProtection(getCompanies, ["superadmin"]);

// POST is also protected - only superadmin can create companies
const createCompany = async (request: Request) => {
  try {
    const json = await request.json();
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
};

// Apply role protection to the handler
export const POST = withRoleProtection(createCompany, ["superadmin"]);
