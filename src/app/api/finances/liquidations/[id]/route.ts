import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Get a single liquidation with related data
async function getLiquidation(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const liquidation = await prisma.tripLiquidation.findUnique({
      where: { id },
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
                id: true,
                busSeatId: true,
                price: true,
                customer: {
                  select: {
                    fullName: true,
                    documentId: true,
                  },
                },
                createdAt: true,
              },
            },
          },
        },
        // Get expenses specifically for this trip
        expenses: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!liquidation) {
      return NextResponse.json(
        { error: "Liquidation not found" },
        { status: 404 }
      );
    }

    // Calculate totals
    const totalIncome = liquidation.trip.tickets.reduce(
      (sum, ticket) =>
        sum +
        (typeof ticket.price === "object"
          ? ticket.price.toNumber()
          : Number(ticket.price)),
      0
    );

    const totalExpenses = liquidation.expenses.reduce(
      (sum, expense) =>
        sum +
        (typeof expense.amount === "object"
          ? expense.amount.toNumber()
          : Number(expense.amount)),
      0
    );

    // Format the expenses to include category name
    const formattedExpenses = liquidation.expenses.map((expense) => ({
      id: expense.id,
      description: expense.description,
      amount:
        typeof expense.amount === "object"
          ? expense.amount.toNumber()
          : Number(expense.amount),
      categoryId: expense.categoryId,
      categoryName: expense.category.name,
      evidenceUrl: expense.evidenceUrl,
      createdAt: expense.createdAt,
      createdBy: expense.createdBy,
    }));

    // Format tickets
    const formattedTickets = liquidation.trip.tickets.map((ticket) => ({
      id: ticket.id,
      seatNumber: ticket.busSeatId,
      price:
        typeof ticket.price === "object"
          ? ticket.price.toNumber()
          : Number(ticket.price),
      passengerName: ticket.customer?.fullName || "Sin nombre",
      passengerDocument: ticket.customer?.documentId || "Sin documento",
      createdAt: ticket.createdAt,
    }));

    // Create origin and destination codes from the first 3 letters
    const originCode = liquidation.trip.route.origin.name
      .substring(0, 3)
      .toUpperCase();
    const destinationCode = liquidation.trip.route.destination.name
      .substring(0, 3)
      .toUpperCase();

    const response = {
      id: liquidation.id,
      tripId: liquidation.tripId,
      status: liquidation.status,
      isPrinted: liquidation.isPrinted,
      notes: liquidation.notes,
      createdAt: liquidation.createdAt,
      updatedAt: liquidation.updatedAt,
      createdBy: liquidation.createdBy,
      liquidationDate: liquidation.createdAt,
      plateNumber: liquidation.trip.bus?.plateNumber || "No asignado",
      busType: liquidation.trip.bus?.template?.name || "No asignado",
      ownerName: liquidation.trip.driver?.fullName || "No asignado",
      trip: {
        id: liquidation.trip.id,
        departureTime: liquidation.trip.departureTime,
        route: {
          id: liquidation.trip.route.id,
          originCode,
          originName: liquidation.trip.route.origin.name,
          destinationCode,
          destinationName: liquidation.trip.route.destination.name,
          routeName: `${liquidation.trip.route.origin.name} - ${liquidation.trip.route.destination.name}`,
          routeCode: `${originCode}-${destinationCode}`,
        },
        bus: liquidation.trip.bus
          ? {
              id: liquidation.trip.bus.id,
              plate: liquidation.trip.bus.plateNumber,
              model: liquidation.trip.bus.template?.name || "Standard",
            }
          : null,
        driver: liquidation.trip.driver
          ? {
              id: liquidation.trip.driver.id,
              name: liquidation.trip.driver.fullName,
            }
          : null,
      },
      tickets: formattedTickets,
      expenses: formattedExpenses,
      summary: {
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        totalTickets: formattedTickets.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching liquidation:", error);
    return NextResponse.json(
      { error: "Failed to fetch liquidation" },
      { status: 500 }
    );
  }
}

// Update a liquidation
async function updateLiquidation(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, isPrinted, notes } = body;

    // Validate the liquidation exists
    const existingLiquidation = await prisma.tripLiquidation.findUnique({
      where: { id },
    });

    if (!existingLiquidation) {
      return NextResponse.json(
        { error: "Liquidation not found" },
        { status: 404 }
      );
    }

    // Update the liquidation
    const updatedLiquidation = await prisma.tripLiquidation.update({
      where: { id },
      data: {
        status: status || undefined,
        isPrinted: isPrinted !== undefined ? isPrinted : undefined,
        notes: notes !== undefined ? notes : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedLiquidation);
  } catch (error) {
    console.error("Error updating liquidation:", error);
    return NextResponse.json(
      { error: "Failed to update liquidation" },
      { status: 500 }
    );
  }
}

// Delete a liquidation
async function deleteLiquidation(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if the liquidation exists
    const liquidation = await prisma.tripLiquidation.findUnique({
      where: { id },
    });

    if (!liquidation) {
      return NextResponse.json(
        { error: "Liquidation not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of pending liquidations
    if (liquidation.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending liquidations can be deleted" },
        { status: 400 }
      );
    }

    // Delete the liquidation
    await prisma.tripLiquidation.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Liquidation deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting liquidation:", error);
    return NextResponse.json(
      { error: "Failed to delete liquidation" },
      { status: 500 }
    );
  }
}

// Export the protected handlers
export const GET = withRoleProtection(getLiquidation, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const PATCH = withRoleProtection(updateLiquidation, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const DELETE = withRoleProtection(deleteLiquidation, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
