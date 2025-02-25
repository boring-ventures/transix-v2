import type { LucideIcon } from "lucide-react";
import type { Role } from "@prisma/client";
import type React from "react";

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface Team {
  name: string;
  logo: LucideIcon;
  plan: string;
}

interface BaseNavItem {
  title: string;
  icon?: LucideIcon;
  badge?: string;
}

export interface NavLink extends BaseNavItem {
  url: string;
  items?: never;
}

export interface NavCollapsible extends BaseNavItem {
  items: NavLink[];
  url?: never;
}

export interface NavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
  items?: {
    title: string;
    url: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
  requiredRole?: string[];
  public?: boolean;
}

export interface SidebarData {
  user: User;
  teams: Team[];
  navGroups: NavGroup[];
}

export interface NavItemProps {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
  requiredRole?: Role[];
  public?: boolean;
}

export interface NavGroupProps {
  title: string;
  items: NavItemProps[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  requiredRole?: Role[];
  public?: boolean;
}
