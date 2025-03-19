import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoleProtection } from "@/lib/api-auth";

async function getFinancialReport(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "income";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const routeId = searchParams.get("routeId");
    const busId = searchParams.get("busId");
    const driverId = searchParams.get("driverId");

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Build trip filter
    const tripFilter: any = {};
    if (Object.keys(dateFilter).length > 0) {
      tripFilter.departureTime = dateFilter;
    }
    if (routeId) {
      tripFilter.routeId = routeId;
    }
    if (busId) {
      tripFilter.busId = busId;
    }
    if (driverId) {
      tripFilter.driverId = driverId;
    }

    let result;

    if (reportType === "income") {
      // Income report
      const tickets = await prisma.ticket.findMany({
        where: {
          trip: tripFilter,
          status: "active",
        },
        include: {
          trip: {
            include: {
              route: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Group tickets by date and route
      const groupedData = tickets.reduce(
        (acc, ticket) => {
          const date = new Date(ticket.trip.departureTime)
            .toISOString()
            .split("T")[0];
          const routeName = ticket.trip.route.name;
          const price =
            typeof ticket.price === "object" &&
            ticket.price !== null &&
            "toNumber" in ticket.price
              ? ticket.price.toNumber()
              : Number(ticket.price || 0);

          if (!acc.byDate[date]) {
            acc.byDate[date] = 0;
          }
          acc.byDate[date] += price;

          if (!acc.byRoute[routeName]) {
            acc.byRoute[routeName] = 0;
          }
          acc.byRoute[routeName] += price;

          acc.total += price;

          return acc;
        },
        { total: 0, byDate: {}, byRoute: {} }
      );

      result = {
        reportType: "income",
        data: groupedData,
        rawData: tickets,
      };
    } else if (reportType === "expenses") {
      // Expenses report
      const expenses = await prisma.tripExpense.findMany({
        where: {
          trip: tripFilter,
        },
        include: {
          category: true,
          trip: {
            include: {
              route: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Group expenses by category and date
      const groupedData = expenses.reduce(
        (acc, expense) => {
          const date = new Date(expense.createdAt).toISOString().split("T")[0];
          const categoryName = expense.category?.name || "Uncategorized";
          const amount =
            typeof expense.amount === "object" &&
            expense.amount !== null &&
            "toNumber" in expense.amount
              ? expense.amount.toNumber()
              : Number(expense.amount || 0);

          if (!acc.byCategory[categoryName]) {
            acc.byCategory[categoryName] = 0;
          }
          acc.byCategory[categoryName] += amount;

          if (!acc.byDate[date]) {
            acc.byDate[date] = 0;
          }
          acc.byDate[date] += amount;

          acc.total += amount;

          return acc;
        },
        { total: 0, byCategory: {}, byDate: {} }
      );

      result = {
        reportType: "expenses",
        data: groupedData,
        rawData: expenses,
      };
    } else if (reportType === "profitability") {
      // Profitability report - both income and expenses
      const [tickets, expenses] = await Promise.all([
        prisma.ticket.findMany({
          where: {
            trip: tripFilter,
            status: "active",
          },
          include: {
            trip: {
              include: {
                route: true,
              },
            },
          },
        }),
        prisma.tripExpense.findMany({
          where: {
            trip: tripFilter,
          },
          include: {
            trip: {
              include: {
                route: true,
              },
            },
          },
        }),
      ]);

      // Group by route
      const routeData = {};

      // Add income by route
      tickets.forEach((ticket) => {
        const routeName = ticket.trip.route.name;
        const price =
          typeof ticket.price === "object" &&
          ticket.price !== null &&
          "toNumber" in ticket.price
            ? ticket.price.toNumber()
            : Number(ticket.price || 0);

        if (!routeData[routeName]) {
          routeData[routeName] = { income: 0, expenses: 0, profit: 0 };
        }
        routeData[routeName].income += price;
        routeData[routeName].profit =
          routeData[routeName].income - routeData[routeName].expenses;
      });

      // Add expenses by route
      expenses.forEach((expense) => {
        const routeName = expense.trip.route.name;
        const amount =
          typeof expense.amount === "object" &&
          expense.amount !== null &&
          "toNumber" in expense.amount
            ? expense.amount.toNumber()
            : Number(expense.amount || 0);

        if (!routeData[routeName]) {
          routeData[routeName] = { income: 0, expenses: 0, profit: 0 };
        }
        routeData[routeName].expenses += amount;
        routeData[routeName].profit =
          routeData[routeName].income - routeData[routeName].expenses;
      });

      // Calculate totals
      const totalIncome = tickets.reduce((sum, ticket) => {
        const price =
          typeof ticket.price === "object" &&
          ticket.price !== null &&
          "toNumber" in ticket.price
            ? ticket.price.toNumber()
            : Number(ticket.price || 0);
        return sum + price;
      }, 0);

      const totalExpenses = expenses.reduce((sum, expense) => {
        const amount =
          typeof expense.amount === "object" &&
          expense.amount !== null &&
          "toNumber" in expense.amount
            ? expense.amount.toNumber()
            : Number(expense.amount || 0);
        return sum + amount;
      }, 0);

      result = {
        reportType: "profitability",
        data: {
          byRoute: routeData,
          total: {
            income: totalIncome,
            expenses: totalExpenses,
            profit: totalIncome - totalExpenses,
          },
        },
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Failed to generate financial report" },
      { status: 500 }
    );
  }
}

export const GET = withRoleProtection(getFinancialReport, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
