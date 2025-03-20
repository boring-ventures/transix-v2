import { useAuth } from "@/providers/auth-provider";

// This hook returns the company ID if the user is a company_admin, branch_admin or seller
// For superadmin, it returns null to allow selection of any company
export function useCompanyFilter() {
  const { profile } = useAuth();

  // Check if the user has a role that should have company hardcoded
  const isCompanyRestricted =
    profile?.role === "company_admin" ||
    profile?.role === "branch_admin" ||
    profile?.role === "seller";

  // Only return the companyId if the user role should be restricted
  const companyId = isCompanyRestricted ? profile?.companyId : null;

  return {
    companyId,
    isCompanyRestricted,
    branchId: profile?.branchId || null,
    userRole: profile?.role || null,
  };
}
