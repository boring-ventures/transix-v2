import { useAuth } from "@/providers/auth-provider";

type RoleType = "superadmin" | "company_admin" | "branch_admin" | "seller";

// Define role hierarchy and permissions
const roleHierarchy: Record<RoleType, number> = {
  superadmin: 4,
  company_admin: 3,
  branch_admin: 2,
  seller: 1,
};

// Define permissions for different sections
export const routePermissions = {
  // Admin routes - only superadmin
  companies: ["superadmin"] as RoleType[],

  // Company routes - superadmin and company_admin
  routes: ["superadmin", "company_admin"] as RoleType[],
  buses: ["superadmin", "company_admin"] as RoleType[],
  "bus-templates": ["superadmin", "company_admin"] as RoleType[],
  drivers: ["superadmin", "company_admin"] as RoleType[],
  profiles: ["superadmin", "company_admin"] as RoleType[],

  // Branch routes - superadmin, company_admin, branch_admin
  locations: ["superadmin", "company_admin", "branch_admin"] as RoleType[],
  schedules: [
    "superadmin",
    "company_admin",
    "branch_admin",
    "seller",
  ] as RoleType[],

  // Selling routes - all roles
  tickets: [
    "superadmin",
    "company_admin",
    "branch_admin",
    "seller",
  ] as RoleType[],
  dashboard: [
    "superadmin",
    "company_admin",
    "branch_admin",
    "seller",
  ] as RoleType[],
};

export function usePermissions() {
  const { profile } = useAuth();

  const hasPermission = (requiredRoles: RoleType[]) => {
    if (!profile) return false;
    return requiredRoles.includes(profile.role as RoleType);
  };

  const hasRole = (requiredRole: RoleType) => {
    if (!profile) return false;
    return (
      roleHierarchy[profile.role as RoleType] >= roleHierarchy[requiredRole]
    );
  };

  const canAccessSection = (section: keyof typeof routePermissions) => {
    if (!profile) return false;
    return routePermissions[section].includes(profile.role as RoleType);
  };

  return {
    hasPermission,
    hasRole,
    canAccessSection,
    userRole: profile?.role as RoleType | undefined,
  };
}
