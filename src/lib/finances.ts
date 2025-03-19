import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Calculate total income from tickets
export async function calculateTotalIncome(tripId: string): Promise<Decimal> {
  const result = await prisma.ticket.aggregate({
    _sum: {
      price: true,
    },
    where: {
      tripId,
      status: "active",
    },
  });

  return result._sum.price || new Decimal(0);
}

// Calculate total expenses for a trip
export async function calculateTotalExpenses(tripId: string): Promise<Decimal> {
  const result = await prisma.tripExpense.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      tripId,
    },
  });

  return result._sum.amount || new Decimal(0);
}

// Create a new liquidation for a trip
export async function createLiquidation(
  tripId: string,
  createdBy: string,
  notes?: string
) {
  // Check if liquidation already exists
  const existingLiquidation = await prisma.tripLiquidation.findUnique({
    where: { tripId },
  });

  if (existingLiquidation) {
    throw new Error("Liquidation already exists for this trip");
  }

  // Create new liquidation
  return prisma.tripLiquidation.create({
    data: {
      tripId,
      status: "pending",
      isPrinted: false,
      notes: notes || "",
      createdBy,
    },
  });
}

// Add expense to a trip
export async function addExpense(
  tripId: string,
  categoryId: string,
  amount: number | Decimal,
  description: string,
  createdBy: string,
  evidenceUrl?: string
) {
  return prisma.tripExpense.create({
    data: {
      tripId,
      categoryId,
      amount,
      description,
      evidenceUrl,
      createdBy,
    },
  });
}

// Update liquidation status
export async function updateLiquidationStatus(
  liquidationId: string,
  status: "pending" | "approved" | "rejected" | "finalized",
  isPrinted?: boolean,
  notes?: string
) {
  return prisma.tripLiquidation.update({
    where: { id: liquidationId },
    data: {
      status,
      isPrinted: isPrinted !== undefined ? isPrinted : undefined,
      notes,
      updatedAt: new Date(),
    },
  });
}

// Get financial summary for dashboard
export async function getFinancialSummary() {
  // Get total income
  const totalIncomeResult = await prisma.ticket.aggregate({
    _sum: {
      price: true,
    },
    where: {
      status: "active",
    },
  });

  // Get total expenses
  const totalExpensesResult = await prisma.tripExpense.aggregate({
    _sum: {
      amount: true,
    },
  });

  // Get number of pending liquidations
  const pendingLiquidationsCount = await prisma.tripLiquidation.count({
    where: {
      status: "pending",
    },
  });

  // Get number of completed liquidations
  const completedLiquidationsCount = await prisma.tripLiquidation.count({
    where: {
      status: "finalized",
    },
  });

  // Get recent trips with financial data
  const recentTrips = await prisma.trip.findMany({
    take: 5,
    orderBy: {
      departureTime: "desc",
    },
    include: {
      route: true,
      tickets: {
        select: {
          price: true,
        },
      },
      expenses: {
        select: {
          amount: true,
        },
      },
    },
  });

  // Process trips to include financial data
  const processedTrips = recentTrips.map((trip) => {
    const income = trip.tickets.reduce(
      (sum, ticket) => sum + (ticket.price || new Decimal(0)),
      new Decimal(0)
    );
    const expenses = trip.expenses.reduce(
      (sum, expense) => sum + (expense.amount || new Decimal(0)),
      new Decimal(0)
    );

    return {
      id: trip.id,
      route: `${trip.route.originCode}-${trip.route.destinationCode}`,
      date: trip.departureTime,
      income: income.toNumber(),
      expenses: expenses.toNumber(),
      net: income.minus(expenses).toNumber(),
    };
  });

  const totalIncome = totalIncomeResult._sum.price || new Decimal(0);
  const totalExpenses = totalExpensesResult._sum.amount || new Decimal(0);
  const netAmount = totalIncome.minus(totalExpenses);

  return {
    totalIncome: totalIncome.toNumber(),
    totalExpenses: totalExpenses.toNumber(),
    netAmount: netAmount.toNumber(),
    pendingLiquidations: pendingLiquidationsCount,
    completedLiquidations: completedLiquidationsCount,
    recentTrips: processedTrips,
  };
}
