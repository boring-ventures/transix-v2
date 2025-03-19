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
      route: {
        include: {
          origin: true,
          destination: true,
        },
      },
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
      (sum, ticket) => sum.plus(ticket.price || new Decimal(0)),
      new Decimal(0)
    );
    const expenses = trip.expenses.reduce(
      (sum, expense) => sum.plus(expense.amount || new Decimal(0)),
      new Decimal(0)
    );

    return {
      id: trip.id,
      route: `${trip.route.origin.name.substring(0, 3).toUpperCase()}-${trip.route.destination.name.substring(0, 3).toUpperCase()}`,
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

// Get expense distribution by category
export async function getExpenseDistributionByCategory(
  timeframe: "week" | "month" | "year" = "month"
) {
  let startDate = new Date();

  // Set the start date based on the timeframe
  if (timeframe === "week") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (timeframe === "month") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (timeframe === "year") {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  // Get expenses grouped by category
  const expenses = await prisma.tripExpense.groupBy({
    by: ["categoryId"],
    _sum: {
      amount: true,
    },
    where: {
      createdAt: {
        gte: startDate,
      },
    },
  });

  // Get category details for each expense group
  const categories = await prisma.expenseCategory.findMany({
    where: {
      id: {
        in: expenses.map((exp) => exp.categoryId),
      },
    },
  });

  // Map the results with category names
  return expenses
    .map((expense) => {
      const category = categories.find((cat) => cat.id === expense.categoryId);
      return {
        name: category?.name || "Uncategorized",
        value: expense._sum.amount?.toNumber() || 0,
        id: expense.categoryId,
      };
    })
    .sort((a, b) => b.value - a.value); // Sort by highest amount
}

// Get monthly financial data for charts
export async function getMonthlyFinancialData(months: number = 6) {
  const result = [];
  const today = new Date();
  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  // Generate last X months data
  for (let i = months - 1; i >= 0; i--) {
    const currentMonth = new Date(today);
    currentMonth.setMonth(today.getMonth() - i);

    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    // Get income for the month from tickets
    const monthlyIncome = await prisma.ticket.aggregate({
      _sum: {
        price: true,
      },
      where: {
        status: "active",
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Get expenses for the month
    const monthlyExpenses = await prisma.tripExpense.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const income = monthlyIncome._sum.price?.toNumber() || 0;
    const expenses = monthlyExpenses._sum.amount?.toNumber() || 0;
    const net = income - expenses;

    result.push({
      date: monthNames[currentMonth.getMonth()],
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
      income,
      expenses,
      net,
    });
  }

  return result;
}
