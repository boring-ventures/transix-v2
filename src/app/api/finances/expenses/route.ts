import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addExpense } from "@/lib/finances";
import { withRoleProtection } from "@/lib/api-auth";

async function getExpenses(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const tripId = searchParams.get("tripId");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build the where clause
    const where: any = {};

    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        {
          trip: { route: { name: { contains: search, mode: "insensitive" } } },
        },
      ];
    }

    if (tripId) {
      where.tripId = tripId;
    }

    // Query the expenses
    const expenses = await prisma.tripExpense.findMany({
      where,
      include: {
        category: true,
        trip: {
          include: {
            route: true,
            bus: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

async function createExpense(request: Request) {
  try {
    const data = await request.json();

    // Get the authenticated user from the request context (handled by withRoleProtection)
    const session = request.headers.get("x-user-session");
    const userId = session ? JSON.parse(session).user.id : null;

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    // Create new expense
    const newExpense = await addExpense(
      data.tripId,
      data.categoryId,
      data.amount,
      data.description,
      userId,
      data.evidenceUrl
    );

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

export const GET = withRoleProtection(getExpenses, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const POST = withRoleProtection(createExpense, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
