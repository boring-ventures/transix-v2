"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type RoleType = "superadmin" | "company_admin" | "branch_admin" | "seller";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: RoleType[];
  fallbackUrl?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackUrl = "/dashboard",
}: RoleGuardProps) {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile) {
      const hasPermission = allowedRoles.includes(profile.role as RoleType);
      if (!hasPermission) {
        router.push(fallbackUrl);
      }
    }
  }, [profile, isLoading, allowedRoles, fallbackUrl, router]);

  // Show nothing while checking permissions
  if (isLoading) {
    return null;
  }

  // If user is logged in and has permission, render children
  if (profile && allowedRoles.includes(profile.role as RoleType)) {
    return <>{children}</>;
  }

  // Otherwise render nothing
  return null;
}

export default RoleGuard;
