"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type RoleType = "superadmin" | "company_admin" | "branch_admin" | "seller";

export function withRoleProtection(
  WrappedComponent: React.ComponentType<any>,
  allowedRoles: RoleType[],
  fallbackUrl: string = "/dashboard"
) {
  return function ProtectedComponent(props: any) {
    const { profile, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && profile) {
        const hasPermission = allowedRoles.includes(profile.role as RoleType);
        if (!hasPermission) {
          router.push(fallbackUrl);
        }
      }
    }, [profile, isLoading, router]);

    // Show nothing while checking permissions
    if (isLoading) {
      return null;
    }

    // If user is not logged in, auth route will handle redirect
    if (!profile) {
      return null;
    }

    // If user has permission, render the wrapped component
    if (allowedRoles.includes(profile.role as RoleType)) {
      return <WrappedComponent {...props} />;
    }

    // Otherwise render nothing (useEffect will handle redirect)
    return null;
  };
}
