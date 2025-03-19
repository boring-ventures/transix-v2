import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

async function getTripSettlements(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse filters
    const status = searchParams.get("status");
    const scheduleId = searchParams.get("scheduleId");
    let sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Map legacy field names to new ones
    if (sortBy === "liquidationDate") {
      sortBy = "settledAt";
    }

    // Build where clause
    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    // Query for settlements with related data
    const settlements = await prisma.tripSettlement.findMany({
      skip,
      take: limit,
      where,
      orderBy: {
        [sortBy]: sortOrder,
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

    // Count total for pagination
    const total = await prisma.tripSettlement.count({ where });

    // Print debug info for the first settlement
    if (settlements.length > 0) {
      const settlement = settlements[0];
      console.log("First Settlement ID:", settlement.id);
      console.log(
        "Schedule:",
        settlement.schedule ? settlement.schedule.id : "No schedule"
      );
      if (settlement.schedule && settlement.schedule.bus) {
        console.log(
          "Bus structure:",
          JSON.stringify(
            {
              id: settlement.schedule.bus.id,
              plateNumber: settlement.schedule.bus.plateNumber,
              templateId: settlement.schedule.bus.templateId,
              template: settlement.schedule.bus.template,
              owner: settlement.schedule.bus.owner,
              companyId: settlement.schedule.bus.companyId,
            },
            null,
            2
          )
        );
      }
    }

    // Format data for response
    const formattedSettlements = settlements.map((settlement) => {
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
          const destinationCode = destination.name
            .substring(0, 3)
            .toUpperCase();

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

        // Use company as owner
        if (settlement.schedule.bus.company) {
          ownerName = settlement.schedule.bus.company.name;
        } else {
          const companyId = settlement.schedule.bus.companyId;
          if (companyId) {
            ownerName = `Company ID: ${companyId}`;
          }
        }
      }

      if (settlement.schedule?.primaryDriver) {
        driverName = settlement.schedule.primaryDriver.fullName;
      }

      return {
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
          description: expense.description,
          category: expense.category.name,
          createdAt: expense.createdAt,
        })),
      };
    });

    return NextResponse.json({
      data: formattedSettlements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching trip settlements:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip settlements" },
      { status: 500 }
    );
  }
}

async function createTripSettlement(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scheduleId,
      settlementDate, // We'll read this but not use it directly
      totalIncome,
      totalExpenses,
      netAmount,
      details,
    } = body;

    // Validate required fields
    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        tripSettlements: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Check if a settlement already exists for this schedule
    if (schedule.tripSettlements.length > 0) {
      return NextResponse.json(
        { error: "A settlement already exists for this schedule" },
        { status: 409 }
      );
    }

    // Create the trip settlement (use settledAt instead of settlementDate)
    const settlement = await prisma.tripSettlement.create({
      data: {
        scheduleId,
        settledAt: settlementDate ? new Date(settlementDate) : new Date(),
        totalIncome: totalIncome || 0,
        totalExpenses: totalExpenses || 0,
        netAmount: netAmount || 0,
        details: details || "",
        status: "pending",
      },
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    console.error("Error creating trip settlement:", error);
    return NextResponse.json(
      { error: "Failed to create trip settlement" },
      { status: 500 }
    );
  }
}

// Export the protected handlers
export const GET = withRoleProtection(getTripSettlements, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);

export const POST = withRoleProtection(createTripSettlement, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
