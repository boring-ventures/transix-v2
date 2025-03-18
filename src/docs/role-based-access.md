# Role-Based Access Control System

## Overview

This document describes the role-based access control (RBAC) system implemented in the TransiX application. The system provides protection for routes, UI components, and API endpoints based on user roles.

## Roles

The system supports the following roles (defined in the Prisma schema):

- `superadmin`: Has access to all features in the application
- `company_admin`: Has access to company-specific features except creating other companies
- `branch_admin`: Has access to branch-specific features but cannot access companies or routes
- `seller`: Has limited access to sell tickets and view trips

## Components

### 1. RoleGuard Component

Located in `src/components/auth/RoleGuard.tsx`, this component protects routes based on user roles:

```tsx
<RoleGuard allowedRoles={[Role.superadmin, Role.company_admin]}>
  <YourProtectedComponent />
</RoleGuard>
```

### 2. RouteProtection Component

Located in `src/components/auth/RouteProtection.tsx`, this component automatically checks permissions based on the current route path. It's used in the dashboard layout to protect all dashboard routes.

### 3. withRoleProtection HOC

Located in `src/components/auth/withRoleProtection.tsx`, this higher-order component can be used to protect specific pages:

```tsx
const ProtectedPage = withRoleProtection(YourPage, [Role.superadmin]);
```

### 4. ConditionalUI Component

Located in `src/components/auth/ConditionalUI.tsx`, this component conditionally renders UI elements based on user roles:

```tsx
<ConditionalUI allowedRoles={[Role.superadmin]}>
  <AdminOnlyFeature />
</ConditionalUI>
```

### 5. AccessDenied Component

Located in `src/components/auth/AccessDenied.tsx`, this component displays a user-friendly message when access is denied:

```tsx
<AccessDenied message="Custom message" redirectUrl="/dashboard" />
```

### 6. API Protection

Located in `src/lib/api-auth.ts`, these utilities protect API routes:

```tsx
// Apply role protection to API route handlers
export const GET = withRoleProtection(getHandler, [Role.superadmin]);
export const POST = withRoleProtection(postHandler, [
  Role.superadmin,
  Role.company_admin,
]);
```

### 7. usePermissions Hook

Located in `src/hooks/use-permissions.ts`, this hook provides utility functions to check permissions in components:

```tsx
const { hasPermission, hasRole, canAccessSection } = usePermissions();

// Check if user can access a section
const canViewCompanies = canAccessSection("companies");

// Check if user has a specific role
const isSuperAdmin = hasRole(Role.superadmin);

// Check if user has any of the specified roles
const canManageRoutes = hasPermission([Role.superadmin, Role.company_admin]);
```

## Implementation

1. The sidebar is automatically filtered based on user roles
2. Each dashboard route is protected by the RouteProtection component
3. API routes can be protected using the withRoleProtection utility
4. Sensitive UI elements can be conditionally rendered using ConditionalUI

## Permission Structure

The permission structure is defined in `src/hooks/use-permissions.ts`:

- **Admin routes** (superadmin only):

  - Companies

- **Company routes** (superadmin, company_admin):

  - Routes
  - Buses
  - Bus Templates
  - Drivers
  - Profiles

- **Branch routes** (superadmin, company_admin, branch_admin):

  - Locations
  - Schedules

- **Selling routes** (all roles):
  - Tickets
  - Dashboard
