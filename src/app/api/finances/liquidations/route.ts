import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

async function getLiquidations(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse filters
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    // Map frontend sort fields to database fields
    let dbSortBy = sortBy;
    if (sortBy === "liquidationDate") {
      dbSortBy = "createdAt";
    }

    // For now, we'll sort only by simple fields as complex relation sorting requires more work
    const orderBy: any = {
      [dbSortBy]: sortOrder,
    };

    // Query for liquidations with related data
    const liquidations = await prisma.tripLiquidation.findMany({
      skip,
      take: limit,
      where,
      orderBy,
      include: {
        trip: {
          include: {
            route: {
              include: {
                origin: true,
                destination: true,
              },
            },
            bus: true,
            driver: true,
            tickets: {
              where: {
                status: "active",
              },
              select: {
                price: true,
              },
            },
            expenses: {
              select: {
                amount: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Count total for pagination
    const total = await prisma.tripLiquidation.count({ where });

    // Format data for response
    const formattedLiquidations = liquidations.map((liquidation) => {
      const totalIncome = liquidation.trip.tickets.reduce(
        (sum, ticket) =>
          sum +
          (typeof ticket.price === "object"
            ? ticket.price.toNumber()
            : Number(ticket.price)),
        0
      );

      const totalExpenses = liquidation.trip.expenses.reduce(
        (sum, expense) =>
          sum +
          (typeof expense.amount === "object"
            ? expense.amount.toNumber()
            : Number(expense.amount)),
        0
      );

      // Create origin and destination codes from the first 3 letters
      const originCode = liquidation.trip.route.origin.name
        .substring(0, 3)
        .toUpperCase();
      const destinationCode = liquidation.trip.route.destination.name
        .substring(0, 3)
        .toUpperCase();

      return {
        id: liquidation.id,
        tripId: liquidation.tripId,
        status: liquidation.status,
        isPrinted: liquidation.isPrinted,
        notes: liquidation.notes,
        createdAt: liquidation.createdAt,
        updatedAt: liquidation.updatedAt,
        createdBy: liquidation.createdBy,
        liquidationDate: liquidation.createdAt,
        route: `${originCode}-${destinationCode}`,
        routeName: `${liquidation.trip.route.origin.name} - ${liquidation.trip.route.destination.name}`,
        departureTime: liquidation.trip.departureTime,
        driver: liquidation.trip.driver?.fullName || "No asignado",
        ownerName: liquidation.trip.driver?.fullName || "No asignado",
        busPlate: liquidation.trip.bus?.plateNumber || "No asignado",
        plateNumber: liquidation.trip.bus?.plateNumber || "No asignado",
        busType: "No asignado",
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
      };
    });

    return NextResponse.json({
      data: formattedLiquidations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching liquidations:", error);
    return NextResponse.json(
      { error: "Failed to fetch liquidations" },
      { status: 500 }
    );
  }
}

async function createLiquidation(req: NextRequest) {
  try {
    const body = await req.json();
    const { tripId, notes, createdBy } = body;

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    // Check if trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if liquidation already exists for this trip
    const existingLiquidation = await prisma.tripLiquidation.findUnique({
      where: { tripId },
    });

    if (existingLiquidation) {
      return NextResponse.json(
        { error: "Liquidation already exists for this trip" },
        { status: 409 }
      );
    }

    // Create new liquidation
    const liquidation = await prisma.tripLiquidation.create({
      data: {
        tripId,
        status: "pending",
        isPrinted: false,
        notes: notes || "",
        createdBy,
      },
    });

    return NextResponse.json(liquidation, { status: 201 });
  } catch (error) {
    console.error("Error creating liquidation:", error);
    return NextResponse.json(
      { error: "Failed to create liquidation" },
      { status: 500 }
    );
  }
}

// Export the protected handlers
export const GET = withRoleProtection(getLiquidations, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const POST = withRoleProtection(createLiquidation, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
