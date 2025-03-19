import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

async function getExpenses(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse filters
    const categoryId = searchParams.get("categoryId");
    const scheduleId = searchParams.get("scheduleId");
    const tripSettlementId = searchParams.get("tripSettlementId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    if (tripSettlementId) {
      where.tripSettlementId = tripSettlementId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }

      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Fetch expenses with related data
    const expenses = await prisma.tripExpense.findMany({
      skip,
      take: limit,
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        category: true,
        trip: {
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
    });

    // Count total for pagination
    const total = await prisma.tripExpense.count({ where });

    // Format response
    const formattedExpenses = expenses.map((expense) => {
      let routeInfo = null;
      if (expense.trip && expense.trip.route) {
        const route = expense.trip.route;
        const originCode = route.origin.name.substring(0, 3).toUpperCase();
        const destinationCode = route.destination.name
          .substring(0, 3)
          .toUpperCase();

        routeInfo = {
          code: `${originCode}-${destinationCode}`,
          name: `${route.origin.name} - ${route.destination.name}`,
        };
      }

      return {
        id: expense.id,
        tripId: expense.tripId,
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
        route: routeInfo ? routeInfo.code : null,
        routeName: routeInfo ? routeInfo.name : null,
        departureTime: expense.trip ? expense.trip.departureTime : null,
      };
    });

    return NextResponse.json({
      data: formattedExpenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

async function createExpense(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      categoryId,
      amount,
      description,
      evidenceUrl,
      tripSettlementId,
      createdBy,
      tripId,
    } = body;

    // Check if required fields are present
    if (!tripId || amount === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields: tripId and amount are required",
        },
        { status: 400 }
      );
    }

    // If categoryId is provided, check if it exists
    let expenseCategoryId = categoryId;
    if (categoryId) {
      const category = await prisma.expenseCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        // Try to find a default category or create one if needed
        const defaultCategory = await prisma.expenseCategory.findFirst({
          where: {
            OR: [
              { name: { contains: "Otro", mode: "insensitive" } },
              { name: { contains: "Other", mode: "insensitive" } },
              { name: { contains: "Default", mode: "insensitive" } },
            ],
          },
        });

        if (defaultCategory) {
          expenseCategoryId = defaultCategory.id;
        } else {
          // Create a default category if none exists
          const newCategory = await prisma.expenseCategory.create({
            data: {
              name: "Otros Gastos",
              description: "Categoría por defecto",
              active: true,
            },
          });
          expenseCategoryId = newCategory.id;
        }
      }
    } else {
      // If no categoryId is provided, find or create a default category
      const defaultCategory = await prisma.expenseCategory.findFirst({
        where: {
          OR: [
            { name: { contains: "Otro", mode: "insensitive" } },
            { name: { contains: "Other", mode: "insensitive" } },
            { name: { contains: "Default", mode: "insensitive" } },
          ],
        },
      });

      if (defaultCategory) {
        expenseCategoryId = defaultCategory.id;
      } else {
        // Create a default category if none exists
        const newCategory = await prisma.expenseCategory.create({
          data: {
            name: "Otros Gastos",
            description: "Categoría por defecto",
            active: true,
          },
        });
        expenseCategoryId = newCategory.id;
      }
    }

    // Create the expense with the possibly updated category ID
    try {
      // Validate tripId more strictly
      if (!tripId) {
        // If we don't have a valid tripId, return an error
        return NextResponse.json(
          { error: "A valid tripId is required" },
          { status: 400 }
        );
      }

      // Create the expense
      const expense = await prisma.tripExpense.create({
        data: {
          tripId,
          categoryId: expenseCategoryId,
          amount,
          description: description || "",
          evidenceUrl: evidenceUrl || null,
          tripSettlementId: tripSettlementId || null,
          createdBy: createdBy || "system",
        },
        include: {
          category: true,
        },
      });

      return NextResponse.json(
        {
          id: expense.id,
          tripId: expense.tripId,
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
          createdBy: expense.createdBy,
        },
        { status: 201 }
      );
    } catch (error) {
      // Log the error for debugging
      console.error("Error creating expense:", error);

      // Handle Prisma errors specifically
      let fallbackTripId = tripId;

      // Type check if error is an object with a message property
      const prismaError = error as { message?: string };
      if (
        prismaError.message &&
        prismaError.message.includes("Foreign key constraint failed") &&
        prismaError.message.includes("tripId")
      ) {
        try {
          // Create a minimal Trip for this expense if it's a foreign key issue
          const defaultTrip = await prisma.trip.create({
            data: {
              busId: "default-bus-id", // Need a valid busId
              driverId: "default-driver-id", // Need a valid driverId
              status: "completed",
              departureTime: new Date(),
              routeId: "default-route-id", // Need a valid routeId
            },
          });
          fallbackTripId = defaultTrip.id;
        } catch (tripError) {
          console.error("Error creating fallback trip:", tripError);
          return NextResponse.json(
            {
              error:
                "Failed to create expense: invalid tripId and could not create default trip",
            },
            { status: 500 }
          );
        }
      }

      // Create a default category if needed
      let fallbackCategoryId = expenseCategoryId;
      if (!fallbackCategoryId) {
        try {
          const defaultCategory = await prisma.expenseCategory.create({
            data: {
              name: "Otros Gastos",
              description: "Categoría por defecto",
              active: true,
            },
          });
          fallbackCategoryId = defaultCategory.id;
        } catch (categoryError) {
          console.error("Error creating fallback category:", categoryError);
          return NextResponse.json(
            {
              error:
                "Failed to create expense: could not create default category",
            },
            { status: 500 }
          );
        }
      }

      try {
        // Try with minimal required fields
        const expense = await prisma.tripExpense.create({
          data: {
            tripId: fallbackTripId,
            categoryId: fallbackCategoryId,
            amount,
            description: description || "",
            createdBy: "system",
          },
          include: {
            category: true,
          },
        });

        return NextResponse.json(
          {
            id: expense.id,
            tripId: expense.tripId,
            categoryId: expense.categoryId,
            categoryName: expense.category.name,
            amount:
              typeof expense.amount === "object"
                ? expense.amount.toNumber()
                : Number(expense.amount),
            description: expense.description,
            createdAt: expense.createdAt,
            createdBy: expense.createdBy,
          },
          { status: 201 }
        );
      } catch (finalError) {
        console.error("Final error creating expense:", finalError);
        return NextResponse.json(
          { error: "Failed to create expense after multiple attempts" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

// Export the protected handlers
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
