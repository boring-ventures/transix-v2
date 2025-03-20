import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-background/10">
            <Image
              src="/images/transix.svg"
              alt="Transix Logo"
              width={isCollapsed ? 32 : 48}
              height={isCollapsed ? 32 : 48}
              className="text-primary-foreground"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-neutro text-base tracking-wide">
              TRANSIX
            </span>
            <span className="truncate text-xs">Sistema de Transporte</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
