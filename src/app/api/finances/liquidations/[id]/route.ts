import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateLiquidationStatus } from "@/lib/finances";
import { withRoleProtection } from "@/lib/api-auth";

async function getLiquidation(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const liquidation = await prisma.tripLiquidation.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            driver: true,
            tickets: {
              include: {
                customer: true,
                seat: true,
              },
            },
            expenses: {
              include: {
                category: true,
              },
            },
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
      (sum, ticket) => sum + (ticket.price || 0),
      0
    );
    const totalExpenses = liquidation.trip.expenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );

    // Group expenses by category
    const expensesByCategory = liquidation.trip.expenses.reduce(
      (acc, expense) => {
        const categoryName = expense.category?.name || "Uncategorized";
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    // Format response data
    const formattedLiquidation = {
      id: liquidation.id,
      tripId: liquidation.tripId,
      route: {
        name: liquidation.trip.route.name,
        origin: liquidation.trip.route.originCode,
        destination: liquidation.trip.route.destinationCode,
      },
      bus: {
        plateNumber: liquidation.trip.bus.plateNumber,
        model: liquidation.trip.bus.model,
        capacity: liquidation.trip.bus.capacity,
      },
      driver: {
        name: liquidation.trip.driver.name,
        phone: liquidation.trip.driver.phone,
      },
      departureTime: liquidation.trip.departureTime,
      arrivalTime: liquidation.trip.arrivalTime,
      tickets: liquidation.trip.tickets.map((ticket) => ({
        id: ticket.id,
        customerName: ticket.customer?.name || "Unknown",
        customerPhone: ticket.customer?.phone || "",
        seatNumber: ticket.seat?.number || "",
        price: ticket.price,
        status: ticket.status,
      })),
      expenses: liquidation.trip.expenses.map((expense) => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        category: expense.category?.name || "Uncategorized",
      })),
      expensesByCategory,
      totalPassengers: liquidation.trip.tickets.length,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      status: liquidation.status,
      isPrinted: liquidation.isPrinted,
      notes: liquidation.notes,
      createdAt: liquidation.createdAt,
      updatedAt: liquidation.updatedAt,
    };

    return NextResponse.json(formattedLiquidation);
  } catch (error) {
    console.error("Error fetching liquidation:", error);
    return NextResponse.json(
      { error: "Failed to fetch liquidation" },
      { status: 500 }
    );
  }
}

async function updateLiquidation(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();

    // Update liquidation status
    const updatedLiquidation = await updateLiquidationStatus(
      id,
      data.status,
      data.isPrinted,
      data.notes
    );

    return NextResponse.json(updatedLiquidation);
  } catch (error) {
    console.error("Error updating liquidation:", error);
    return NextResponse.json(
      { error: "Failed to update liquidation" },
      { status: 500 }
    );
  }
}

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
