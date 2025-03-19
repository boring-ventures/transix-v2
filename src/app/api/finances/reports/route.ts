import { NextRequest, NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import {
  getExpenseDistributionByCategory,
  getMonthlyFinancialData,
} from "@/lib/finances";

async function getFinancialReports(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const report = searchParams.get("report") || "monthly"; // Default to monthly
    const timeframe = searchParams.get("timeframe") || "month"; // Default to month
    const months = parseInt(searchParams.get("months") || "6"); // Default to 6 months

    let data;

    if (report === "expenses") {
      // Validate timeframe
      if (!["week", "month", "year"].includes(timeframe as string)) {
        return NextResponse.json(
          { error: "Invalid timeframe. Must be 'week', 'month', or 'year'" },
          { status: 400 }
        );
      }

      data = await getExpenseDistributionByCategory(
        timeframe as "week" | "month" | "year"
      );
    } else if (report === "monthly") {
      data = await getMonthlyFinancialData(months);
    } else {
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching financial reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial reports" },
      { status: 500 }
    );
  }
}

// Export the protected handler
export const GET = withRoleProtection(getFinancialReports, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
