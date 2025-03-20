import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { useCompanyFilter } from "./use-company-filter";

export interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  pendingLiquidations: number;
  completedLiquidations: number;
  recentTrips: any[]; // This would need a more specific type depending on the actual API response
}

export function useFinances(externalCompanyId?: string) {
  const queryClient = useQueryClient();
  const { companyId: userCompanyId, isCompanyRestricted } = useCompanyFilter();

  // If user is restricted to a company, use their company ID, otherwise use the provided one
  const effectiveCompanyId = isCompanyRestricted
    ? userCompanyId
    : externalCompanyId;

  // Fetch finances summary
  const {
    data: financesSummary,
    isLoading: isLoadingFinances,
    error: financesError,
    refetch: refetchFinances,
  } = useQuery({
    queryKey: ["finances", effectiveCompanyId],
    queryFn: async () => {
      let url = "/api/finances/summary";

      if (effectiveCompanyId) {
        url += `?companyId=${effectiveCompanyId}`;
      }

      const response = await axios.get(url);
      return response.data;
    },
  });

  // Fetch all settlements
  const {
    data: settlements = [],
    isLoading: isLoadingSettlements,
    error: settlementsError,
  } = useQuery({
    queryKey: ["settlements", effectiveCompanyId],
    queryFn: async () => {
      let url = "/api/finances/settlements";

      if (effectiveCompanyId) {
        url += `?companyId=${effectiveCompanyId}`;
      }

      const response = await axios.get(url);
      return response.data.settlements;
    },
  });

  // Fetch finance stats
  const {
    data: financeStats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["finances", { userCompanyId }],
    queryFn: async () => {
      let url = "/api/finances";

      // If user is company_admin, branch_admin or seller, automatically filter by their company
      if (userCompanyId) {
        url += `?companyId=${userCompanyId}`;
      }

      const response = await axios.get(url);
      return response.data as FinanceStats;
    },
  });

  // Fetch monthly financial data
  const fetchMonthlyData = useCallback(
    async (months: number = 6) => {
      let url = `/api/finances/reports?report=monthly&months=${months}`;

      // If user is company_admin, branch_admin or seller, automatically filter by their company
      if (userCompanyId) {
        url += `&companyId=${userCompanyId}`;
      }

      const response = await axios.get(url);
      return response.data;
    },
    [userCompanyId]
  );

  // Fetch expense distribution data
  const fetchExpenseDistribution = useCallback(
    async (timeframe: "week" | "month" | "year" = "month") => {
      let url = `/api/finances/reports?report=expenses&timeframe=${timeframe}`;

      // If user is company_admin, branch_admin or seller, automatically filter by their company
      if (userCompanyId) {
        url += `&companyId=${userCompanyId}`;
      }

      const response = await axios.get(url);
      return response.data;
    },
    [userCompanyId]
  );

  return {
    financesSummary,
    isLoadingFinances,
    financesError,
    refetchFinances,
    settlements,
    isLoadingSettlements,
    settlementsError,
    isCompanyRestricted,
    userCompanyId,
    financeStats,
    isLoading,
    error,
    refetch,
    fetchMonthlyData,
    fetchExpenseDistribution,
  };
}
