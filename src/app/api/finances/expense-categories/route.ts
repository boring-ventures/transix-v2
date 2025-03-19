import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoleProtection } from "@/lib/api-auth";

async function getExpenseCategories() {
  try {
    // Query all expense categories
    const categories = await prisma.expenseCategory.findMany({
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

async function createExpenseCategory(request: Request) {
  try {
    const data = await request.json();

    // Create new expense category
    const newCategory = await prisma.expenseCategory.create({
      data: {
        name: data.name,
        description: data.description || "",
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating expense category:", error);
    return NextResponse.json(
      { error: "Failed to create expense category" },
      { status: 500 }
    );
  }
}

export const GET = withRoleProtection(getExpenseCategories, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const POST = withRoleProtection(createExpenseCategory, [
  "superadmin",
  "company_admin",
]);
