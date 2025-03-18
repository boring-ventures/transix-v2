import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

type RoleType = "superadmin" | "company_admin" | "branch_admin" | "seller";

/**
 * Check if the current user has the required role(s) to access an API route
 *
 * @param allowedRoles Array of roles that can access the route
 * @returns A NextResponse object if access is denied, or null if access is allowed
 */
export async function checkApiRoutePermission(allowedRoles: RoleType[]) {
  try {
    // Get the current session
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the user's profile to check their role
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { role: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if the user has any of the required roles
    const hasPermission = allowedRoles.includes(profile.role as RoleType);

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to access this resource" },
        { status: 403 }
      );
    }

    // If everything is okay, return null to proceed with the API request
    return null;
  } catch (error) {
    console.error("Error checking API permissions:", error);
    return NextResponse.json(
      { error: "Server error while checking permissions" },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to protect API routes with role-based access control
 *
 * @param handler The API route handler function
 * @param allowedRoles Array of roles that can access the route
 * @returns A wrapped handler function with permission checks
 */
export function withRoleProtection(
  handler: Function,
  allowedRoles: RoleType[]
) {
  // Return a function with the same signature as the handler
  return async (request: Request, context: any) => {
    const permissionCheck = await checkApiRoutePermission(allowedRoles);

    // If permissionCheck returns a response, access was denied
    if (permissionCheck) {
      return permissionCheck;
    }

    // If we have a Promise in params, resolve it (backwards compatibility)
    if (context?.params && context.params instanceof Promise) {
      const resolvedParams = await context.params;
      // Create a new context with resolved params
      const newContext = { ...context, params: resolvedParams };
      return handler(request, newContext);
    }

    // Otherwise, proceed with the original handler and pass all arguments
    return handler(request, context);
  };
}
