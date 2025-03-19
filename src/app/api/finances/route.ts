import { NextResponse } from "next/server";
import { withRoleProtection } from "@/lib/api-auth";
import { getFinancialSummary } from "@/lib/finances";

async function getFinances() {
  try {
    const financialData = await getFinancialSummary();
    return NextResponse.json(financialData);
  } catch (error) {
    console.error("Error fetching finance stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch finance stats" },
      { status: 500 }
    );
  }
}

// Export the protected handler
export const GET = withRoleProtection(getFinances, [
  "superadmin",
  "company_admin",
  "branch_admin",
]);
