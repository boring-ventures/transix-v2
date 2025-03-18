"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { routePermissions } from "@/hooks/use-permissions";

type RoleType = "superadmin" | "company_admin" | "branch_admin" | "seller";

interface RouteProtectionProps {
  children: React.ReactNode;
}

export function RouteProtection({ children }: RouteProtectionProps) {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && profile) {
      // Extract the first part of the route path (e.g., /companies/123 -> companies)
      const basePath = pathname.split("/")[1];

      // If there's no base path, default to dashboard
      if (!basePath) {
        return;
      }

      // Check if this route has defined permissions
      const routeKey = basePath as keyof typeof routePermissions;
      if (routePermissions[routeKey]) {
        const hasPermission = routePermissions[routeKey].includes(
          profile.role as RoleType
        );

        if (!hasPermission) {
          // Redirect to dashboard if the user doesn't have permission
          router.push("/dashboard");
        }
      }
    }
  }, [profile, isLoading, pathname, router]);

  // Show nothing while checking permissions
  if (isLoading) {
    return null;
  }

  // If user is not logged in, auth route will handle redirect
  if (!profile) {
    return null;
  }

  // If we've reached here, the user has permission or the route doesn't need special permissions
  return <>{children}</>;
}

export default RouteProtection;
