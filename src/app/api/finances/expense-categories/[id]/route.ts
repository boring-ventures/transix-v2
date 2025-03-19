import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Get a single expense category
async function getExpenseCategory(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const category = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Expense category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching expense category:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense category" },
      { status: 500 }
    );
  }
}

// Update an expense category
async function updateExpenseCategory(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, description, active } = body;

    // Check if category exists
    const existingCategory = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Expense category not found" },
        { status: 404 }
      );
    }

    // Check if name already exists (if changing name)
    if (name && name !== existingCategory.name) {
      const nameExists = await prisma.expenseCategory.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
          id: {
            not: id,
          },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update the category
    const updatedCategory = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating expense category:", error);
    return NextResponse.json(
      { error: "Failed to update expense category" },
      { status: 500 }
    );
  }
}

// Delete an expense category
async function deleteExpenseCategory(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if category exists
    const category = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Expense category not found" },
        { status: 404 }
      );
    }

    // Check if category is used in any expenses
    const expensesCount = await prisma.tripExpense.count({
      where: {
        categoryId: id,
      },
    });

    if (expensesCount > 0) {
      // Instead of deleting, mark as inactive
      const updatedCategory = await prisma.expenseCategory.update({
        where: { id },
        data: {
          active: false,
        },
      });

      return NextResponse.json({
        message:
          "Category has existing expenses, marked as inactive instead of deleting",
        category: updatedCategory,
      });
    }

    // Delete the category if it's not used
    await prisma.expenseCategory.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Expense category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting expense category:", error);
    return NextResponse.json(
      { error: "Failed to delete expense category" },
      { status: 500 }
    );
  }
}

// Export the protected handlers
export const GET = withRoleProtection(getExpenseCategory, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const PATCH = withRoleProtection(updateExpenseCategory, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const DELETE = withRoleProtection(deleteExpenseCategory, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
