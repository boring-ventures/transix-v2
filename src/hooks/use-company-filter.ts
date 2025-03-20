import { useAuth } from "@/providers/auth-provider";
import type { Profile as ProfilesProfile } from "@/hooks/use-profiles";

// This hook returns the company ID if the user is a company_admin, branch_admin or seller
// For superadmin, it returns null to allow selection of any company
export function useCompanyFilter() {
  const { profile } = useAuth();

  // Check if the user has a role that should have company hardcoded
  const isCompanyRestricted =
    profile?.role === "company_admin" ||
    profile?.role === "branch_admin" ||
    profile?.role === "seller";

  // Cast to the correct Profile type that includes companyId and branchId
  const typedProfile = profile as unknown as ProfilesProfile;

  // Only return the companyId if the user role should be restricted
  const companyId = isCompanyRestricted ? typedProfile?.companyId : null;

  return {
    companyId,
    isCompanyRestricted,
    branchId: typedProfile?.branchId || null,
    userRole: profile?.role || null,
  };
}
