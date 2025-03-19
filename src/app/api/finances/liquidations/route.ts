import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLiquidation } from "@/lib/finances";
import { withRoleProtection } from "@/lib/api-auth";

async function getLiquidations(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "liquidationDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build the where clause
    const where: any = {};

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        {
          trip: { route: { name: { contains: search, mode: "insensitive" } } },
        },
        {
          trip: {
            bus: { plateNumber: { contains: search, mode: "insensitive" } },
          },
        },
        {
          trip: { driver: { name: { contains: search, mode: "insensitive" } } },
        },
      ];
    }

    // Query the liquidations
    const liquidations = await prisma.tripLiquidation.findMany({
      where,
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            driver: true,
            tickets: true,
            expenses: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // Process liquidations to include all required information
    const processedLiquidations = liquidations.map((liquidation) => {
      const totalIncome = liquidation.trip.tickets.reduce(
        (sum, ticket) => sum + (ticket.price || 0),
        0
      );
      const totalExpenses = liquidation.trip.expenses.reduce(
        (sum, expense) => sum + (expense.amount || 0),
        0
      );

      return {
        id: liquidation.id,
        tripSettlementId: liquidation.tripId,
        ownerId: liquidation.trip.bus.ownerId,
        ownerName: liquidation.trip.driver.name, // Using driver name as owner for now
        liquidationDate: liquidation.createdAt,
        routeName: `${liquidation.trip.route.originCode}-${liquidation.trip.route.destinationCode}`,
        plateNumber: liquidation.trip.bus.plateNumber,
        busType: liquidation.trip.bus.model,
        departureTime: liquidation.trip.departureTime,
        totalPassengers: liquidation.trip.tickets.length,
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        status: liquidation.status.toLowerCase(),
        isPrinted: liquidation.isPrinted,
      };
    });

    return NextResponse.json(processedLiquidations);
  } catch (error) {
    console.error("Error fetching liquidations:", error);
    return NextResponse.json(
      { error: "Failed to fetch liquidations" },
      { status: 500 }
    );
  }
}

async function createNewLiquidation(request: Request) {
  try {
    const data = await request.json();

    // Get the authenticated user from the request context (handled by withRoleProtection)
    const session = request.headers.get("x-user-session");
    const userId = session ? JSON.parse(session).user.id : null;

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    // Create new liquidation
    const newLiquidation = await createLiquidation(
      data.tripId,
      userId,
      data.notes
    );

    return NextResponse.json(newLiquidation, { status: 201 });
  } catch (error) {
    console.error("Error creating liquidation:", error);
    return NextResponse.json(
      { error: "Failed to create liquidation" },
      { status: 500 }
    );
  }
}

export const GET = withRoleProtection(getLiquidations, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const POST = withRoleProtection(createNewLiquidation, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
