import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Get a single expense with related data
async function getExpense(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const expense = await prisma.tripExpense.findUnique({
      where: { id },
      include: {
        category: true,
        schedule: {
          include: {
            routeSchedule: {
              include: {
                route: {
                  include: {
                    origin: true,
                    destination: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Format the response
    let routeInfo = null;
    if (expense.schedule && expense.schedule.routeSchedule) {
      const route = expense.schedule.routeSchedule.route;
      const originCode = route.origin.name.substring(0, 3).toUpperCase();
      const destinationCode = route.destination.name
        .substring(0, 3)
        .toUpperCase();

      routeInfo = {
        id: route.id,
        originCode,
        originName: route.origin.name,
        destinationCode,
        destinationName: route.destination.name,
        routeCode: `${originCode}-${destinationCode}`,
        routeName: `${route.origin.name} - ${route.destination.name}`,
      };
    }

    const response = {
      id: expense.id,
      scheduleId: expense.scheduleId,
      tripSettlementId: expense.tripSettlementId,
      categoryId: expense.categoryId,
      categoryName: expense.category.name,
      amount:
        typeof expense.amount === "object"
          ? expense.amount.toNumber()
          : Number(expense.amount),
      description: expense.description,
      evidenceUrl: expense.evidenceUrl,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      createdBy: expense.createdBy,
      schedule: expense.schedule
        ? {
            id: expense.schedule.id,
            departureTime: expense.schedule.departureDate,
            route: routeInfo,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

// Update an expense
async function updateExpense(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { categoryId, amount, description, evidenceUrl } = body;

    // Check if expense exists
    const existingExpense = await prisma.tripExpense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.expenseCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Expense category not found" },
          { status: 404 }
        );
      }
    }

    // Update the expense
    const updatedExpense = await prisma.tripExpense.update({
      where: { id },
      data: {
        categoryId: categoryId || undefined,
        amount: amount !== undefined ? amount : undefined,
        description: description || undefined,
        evidenceUrl: evidenceUrl !== undefined ? evidenceUrl : undefined,
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      id: updatedExpense.id,
      scheduleId: updatedExpense.scheduleId,
      tripSettlementId: updatedExpense.tripSettlementId,
      categoryId: updatedExpense.categoryId,
      categoryName: updatedExpense.category.name,
      amount:
        typeof updatedExpense.amount === "object"
          ? updatedExpense.amount.toNumber()
          : Number(updatedExpense.amount),
      description: updatedExpense.description,
      evidenceUrl: updatedExpense.evidenceUrl,
      createdAt: updatedExpense.createdAt,
      updatedAt: updatedExpense.updatedAt,
      createdBy: updatedExpense.createdBy,
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// Delete an expense
async function deleteExpense(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if expense exists
    const expense = await prisma.tripExpense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Check if expense is part of a finalized settlement
    if (expense.tripSettlementId) {
      const settlement = await prisma.tripSettlement.findUnique({
        where: { id: expense.tripSettlementId },
      });

      if (settlement && ["approved", "finalized"].includes(settlement.status)) {
        return NextResponse.json(
          {
            error:
              "Cannot delete expense from approved or finalized settlement",
          },
          { status: 400 }
        );
      }
    }

    // Delete the expense
    await prisma.tripExpense.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Expense deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}

// Export the protected handlers
export const GET = withRoleProtection(getExpense, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const PATCH = withRoleProtection(updateExpense, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const DELETE = withRoleProtection(deleteExpense, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
