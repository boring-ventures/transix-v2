"use client";

import { useAuth } from "@/providers/auth-provider";
import { AccessDenied } from "./AccessDenied";

type RoleType = "superadmin" | "company_admin" | "branch_admin" | "seller";

interface ConditionalUIProps {
  children: React.ReactNode;
  allowedRoles: RoleType[];
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
  message?: string;
  redirectUrl?: string;
  redirectText?: string;
}

/**
 * Component that conditionally renders content based on user role
 *
 * @param {React.ReactNode} children - The content to render if user has required role
 * @param {RoleType[]} allowedRoles - Array of roles allowed to see the content
 * @param {React.ReactNode} fallback - Optional content to show if user doesn't have permission
 * @param {boolean} showAccessDenied - Whether to show the access denied component if no fallback is provided
 * @param {string} message - Custom message to display in the AccessDenied component
 * @param {string} redirectUrl - URL to redirect to when user clicks the button in AccessDenied
 * @param {string} redirectText - Text for the button in AccessDenied
 */
export function ConditionalUI({
  children,
  allowedRoles,
  fallback,
  showAccessDenied = true,
  message,
  redirectUrl,
  redirectText,
}: ConditionalUIProps) {
  const { profile } = useAuth();

  if (!profile) {
    return null;
  }

  if (allowedRoles.includes(profile.role as RoleType)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAccessDenied) {
    return (
      <AccessDenied
        message={message}
        redirectUrl={redirectUrl}
        redirectText={redirectText}
      />
    );
  }

  return null;
}
