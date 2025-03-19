import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Get expense categories with optional filters
async function getExpenseCategories(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");

    // Build where clause
    const where: any = {};
    if (active !== null) {
      where.active = active === "true";
    }

    // Query for expense categories
    const categories = await prisma.expenseCategory.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense categories" },
      { status: 500 }
    );
  }
}

// Create a new expense category
async function createExpenseCategory(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, isActive = true } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if a category with the same name already exists
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive", // Case insensitive
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(existingCategory);
    }

    // Create the category
    const category = await prisma.expenseCategory.create({
      data: {
        name,
        description: description || "",
        active: isActive,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating expense category:", error);
    return NextResponse.json(
      { error: "Failed to create expense category" },
      { status: 500 }
    );
  }
}

// Export the protected handlers
export const GET = withRoleProtection(getExpenseCategories, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const POST = withRoleProtection(createExpenseCategory, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
