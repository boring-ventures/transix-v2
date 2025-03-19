import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

async function getTripSettlement(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Query for the settlement with related data
    const settlement = await prisma.tripSettlement.findUnique({
      where: { id },
      include: {
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
            bus: {
              include: {
                template: true,
                company: true,
              },
            },
            primaryDriver: true,
          },
        },
        expenses: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: "Trip settlement not found" },
        { status: 404 }
      );
    }

    // Format data for response
    // Set up route info
    let routeInfo = null;
    let busType = null;
    let plateNumber = null;
    let driverName = null;
    let routeName = null;
    let ownerName = null;

    if (settlement.schedule?.routeSchedule?.route) {
      const route = settlement.schedule.routeSchedule.route;
      const origin = route.origin;
      const destination = route.destination;

      if (origin && destination) {
        const originCode = origin.name.substring(0, 3).toUpperCase();
        const destinationCode = destination.name.substring(0, 3).toUpperCase();

        routeInfo = {
          id: route.id,
          originCode,
          originName: origin.name,
          destinationCode,
          destinationName: destination.name,
          routeCode: `${originCode}-${destinationCode}`,
          routeName: `${origin.name} - ${destination.name}`,
        };

        routeName = routeInfo.routeName;
      }
    }

    // Get bus and driver info
    if (settlement.schedule?.bus) {
      busType = settlement.schedule.bus.template?.name || "Unknown";
      plateNumber = settlement.schedule.bus.plateNumber;
      ownerName = "Unknown";
    }

    if (settlement.schedule?.primaryDriver) {
      driverName = settlement.schedule.primaryDriver.fullName;
    }

    const formattedSettlement = {
      id: settlement.id,
      scheduleId: settlement.scheduleId,
      totalIncome:
        typeof settlement.totalIncome === "object"
          ? settlement.totalIncome.toNumber()
          : Number(settlement.totalIncome),
      totalExpenses:
        typeof settlement.totalExpenses === "object"
          ? settlement.totalExpenses.toNumber()
          : Number(settlement.totalExpenses),
      netAmount:
        typeof settlement.netAmount === "object"
          ? settlement.netAmount.toNumber()
          : Number(settlement.netAmount),
      status: settlement.status,
      details: settlement.details,
      settledAt: settlement.settledAt,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
      route: routeInfo?.routeCode,
      routeName,
      plateNumber,
      busType,
      driverName,
      ownerName,
      departureTime: settlement.schedule?.departureDate,
      expenses: settlement.expenses.map((expense) => ({
        id: expense.id,
        amount:
          typeof expense.amount === "object"
            ? expense.amount.toNumber()
            : Number(expense.amount),
        description: expense.description || "",
        category: expense.category?.name || "Gasto",
        createdAt: expense.createdAt,
      })),
    };

    return NextResponse.json(formattedSettlement);
  } catch (error) {
    console.error("Error fetching trip settlement:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip settlement" },
      { status: 500 }
    );
  }
}

// Update a trip settlement
async function updateTripSettlement(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status } = body;

    // Validate the status
    if (status && !["PENDING", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Update the settlement
    const settlement = await prisma.tripSettlement.update({
      where: { id },
      data: {
        status: status || undefined,
      },
      include: {
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
            bus: {
              include: {
                template: true,
                company: true,
              },
            },
            primaryDriver: true,
          },
        },
        expenses: {
          include: {
            category: true,
          },
        },
      },
    });

    // Format data for response
    // Set up route info
    let routeInfo = null;
    let busType = null;
    let plateNumber = null;
    let driverName = null;
    let routeName = null;
    let ownerName = null;

    if (settlement.schedule?.routeSchedule?.route) {
      const route = settlement.schedule.routeSchedule.route;
      const origin = route.origin;
      const destination = route.destination;

      if (origin && destination) {
        const originCode = origin.name.substring(0, 3).toUpperCase();
        const destinationCode = destination.name.substring(0, 3).toUpperCase();

        routeInfo = {
          id: route.id,
          originCode,
          originName: origin.name,
          destinationCode,
          destinationName: destination.name,
          routeCode: `${originCode}-${destinationCode}`,
          routeName: `${origin.name} - ${destination.name}`,
        };

        routeName = routeInfo.routeName;
      }
    }

    // Get bus and driver info
    if (settlement.schedule?.bus) {
      busType = settlement.schedule.bus.template?.name || "Unknown";
      plateNumber = settlement.schedule.bus.plateNumber;
      ownerName = "Unknown";
    }

    if (settlement.schedule?.primaryDriver) {
      driverName = settlement.schedule.primaryDriver.fullName;
    }

    const formattedSettlement = {
      id: settlement.id,
      scheduleId: settlement.scheduleId,
      totalIncome:
        typeof settlement.totalIncome === "object"
          ? settlement.totalIncome.toNumber()
          : Number(settlement.totalIncome),
      totalExpenses:
        typeof settlement.totalExpenses === "object"
          ? settlement.totalExpenses.toNumber()
          : Number(settlement.totalExpenses),
      netAmount:
        typeof settlement.netAmount === "object"
          ? settlement.netAmount.toNumber()
          : Number(settlement.netAmount),
      status: settlement.status,
      details: settlement.details,
      settledAt: settlement.settledAt,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
      route: routeInfo?.routeCode,
      routeName,
      plateNumber,
      busType,
      driverName,
      ownerName,
      departureTime: settlement.schedule?.departureDate,
      expenses: settlement.expenses.map((expense) => ({
        id: expense.id,
        amount:
          typeof expense.amount === "object"
            ? expense.amount.toNumber()
            : Number(expense.amount),
        description: expense.description || "",
        category: expense.category?.name || "Gasto",
        createdAt: expense.createdAt,
      })),
    };

    return NextResponse.json(formattedSettlement);
  } catch (error) {
    console.error("Error updating trip settlement:", error);
    return NextResponse.json(
      { error: "Failed to update trip settlement" },
      { status: 500 }
    );
  }
}

// Delete a trip settlement
async function deleteTripSettlement(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existingSettlement = await prisma.tripSettlement.findUnique({
      where: { id },
      include: {
        expenses: true,
      },
    });

    if (!existingSettlement) {
      return NextResponse.json(
        { error: "Trip settlement not found" },
        { status: 404 }
      );
    }

    // Prevent deleting approved or finalized settlements
    if (["approved", "finalized"].includes(existingSettlement.status)) {
      return NextResponse.json(
        { error: "Cannot delete an approved or finalized settlement" },
        { status: 400 }
      );
    }

    // Delete associated expenses first
    if (existingSettlement.expenses.length > 0) {
      await prisma.tripExpense.deleteMany({
        where: { tripSettlementId: id },
      });
    }

    // Delete the settlement
    await prisma.tripSettlement.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Trip settlement deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting trip settlement:", error);
    return NextResponse.json(
      { error: "Failed to delete trip settlement" },
      { status: 500 }
    );
  }
}

async function getTripSettlementById(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Query for the settlement with related data
    const settlement = await prisma.tripSettlement.findUnique({
      where: { id },
      include: {
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
            bus: {
              include: {
                template: true,
              },
            },
            primaryDriver: true,
            secondaryDriver: true,
          },
        },
        expenses: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: "Trip settlement not found" },
        { status: 404 }
      );
    }

    // Format data for response
    // Set up route info
    let routeInfo = null;
    let busType = null;
    let plateNumber = null;
    let driverName = null;
    let routeName = null;
    let ownerName = null;

    if (settlement.schedule?.routeSchedule?.route) {
      const route = settlement.schedule.routeSchedule.route;
      const origin = route.origin;
      const destination = route.destination;

      if (origin && destination) {
        const originCode = origin.name.substring(0, 3).toUpperCase();
        const destinationCode = destination.name.substring(0, 3).toUpperCase();

        routeInfo = {
          id: route.id,
          originCode,
          originName: origin.name,
          destinationCode,
          destinationName: destination.name,
          routeCode: `${originCode}-${destinationCode}`,
          routeName: `${origin.name} - ${destination.name}`,
        };

        routeName = routeInfo.routeName;
      }
    }

    // Get bus and driver info
    if (settlement.schedule?.bus) {
      busType = settlement.schedule.bus.template?.name || "Unknown";
      plateNumber = settlement.schedule.bus.plateNumber;
      ownerName = "Unknown";
    }

    if (settlement.schedule?.primaryDriver) {
      driverName = settlement.schedule.primaryDriver.fullName;
    }

    const formattedSettlement = {
      id: settlement.id,
      scheduleId: settlement.scheduleId,
      totalIncome:
        typeof settlement.totalIncome === "object"
          ? settlement.totalIncome.toNumber()
          : Number(settlement.totalIncome),
      totalExpenses:
        typeof settlement.totalExpenses === "object"
          ? settlement.totalExpenses.toNumber()
          : Number(settlement.totalExpenses),
      netAmount:
        typeof settlement.netAmount === "object"
          ? settlement.netAmount.toNumber()
          : Number(settlement.netAmount),
      status: settlement.status,
      details: settlement.details,
      settledAt: settlement.settledAt,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
      route: routeInfo,
      routeName,
      plateNumber,
      busType,
      driverName,
      ownerName,
      departureTime: settlement.schedule?.departureDate,
      expenses: settlement.expenses.map((expense) => ({
        id: expense.id,
        amount:
          typeof expense.amount === "object"
            ? expense.amount.toNumber()
            : Number(expense.amount),
        description: expense.description,
        category: expense.category.name,
        createdAt: expense.createdAt,
      })),
    };

    return NextResponse.json(formattedSettlement);
  } catch (error) {
    console.error("Error fetching trip settlement:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip settlement" },
      { status: 500 }
    );
  }
}

// Export the protected handlers
export const GET = withRoleProtection(getTripSettlement, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const PATCH = withRoleProtection(updateTripSettlement, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const DELETE = withRoleProtection(deleteTripSettlement, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
