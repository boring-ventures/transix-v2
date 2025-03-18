"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { sidebarData } from "./data/sidebar-data";
import { useAuth } from "@/providers/auth-provider";
import { useMemo } from "react";
import type { NavItem } from "./types";
import { Role } from "@prisma/client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile } = useAuth();

  // Filter sidebar items based on user role
  const filteredNavGroups = useMemo(() => {
    if (!profile) return [];

    const userRole = profile.role;

    return sidebarData.navGroups
      .map((group) => {
        // Filter items based on user's role
        const filteredItems = group.items
          .filter((item) => {
            // Check if the user has permission to see this item
            if (!item.requiredRole) return true; // If no required role, show to everyone
            return item.requiredRole.includes(userRole as Role);
          })
          .map((item) => {
            // If item has sub-items, filter those too
            if (item.items) {
              return {
                ...item,
                items: item.items.filter((subItem) => {
                  if (!subItem.requiredRole) return true;
                  return subItem.requiredRole.includes(userRole as Role);
                }),
              };
            }
            return item;
          });

        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter((group) => group.items.length > 0); // Remove empty groups
  }, [profile]);

  if (!profile) return null;

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
