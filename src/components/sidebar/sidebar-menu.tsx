"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarData } from "./data/sidebar-data";

export function SidebarMenu() {
  const pathname = usePathname();
  // Initialize all menu items as closed
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to handle client-side initialization
  useEffect(() => {
    // Mark that we're now on the client
    setIsClient(true);
    
    // Initialize open state based on current path
    const initialOpenState: Record<string, boolean> = {};
    
    sidebarData.forEach(item => {
      if (item.submenu) {
        // Check if current path matches any submenu item
        const isActive = item.submenu.some(subItem => 
          pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
        );
        initialOpenState[item.id] = isActive;
      }
    });
    
    setOpenMenus(initialOpenState);
  }, [pathname]);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Only render the dynamic parts of the menu after client-side hydration
  if (!isClient) {
    // Return a simplified version for server-side rendering
    return (
      <div className="space-y-1">
        {sidebarData.map(item => (
          <div key={item.id} className="sidebar-item">
            <div className="sidebar-link">{item.title}</div>
            {/* Don't render submenu on server */}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sidebarData.map(item => (
        <div key={item.id} className="sidebar-item">
          {item.submenu ? (
            <>
              <button
                onClick={() => toggleMenu(item.id)}
                className={cn(
                  "sidebar-link",
                  item.submenu.some(subItem => 
                    pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
                  ) && "active"
                )}
                aria-expanded={openMenus[item.id]}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                <span>{item.title}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "ml-auto h-4 w-4 transition-transform",
                    openMenus[item.id] && "rotate-180"
                  )}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openMenus[item.id] && (
                <ul className="sidebar-submenu">
                  {item.submenu.map(subItem => (
                    <li key={subItem.href}>
                      <Link
                        href={subItem.href}
                        className={cn(
                          "sidebar-sublink",
                          (pathname === subItem.href || 
                           pathname.startsWith(`${subItem.href}/`)) && "active"
                        )}
                      >
                        {subItem.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <Link
              href={item.href || "#"}
              className={cn(
                "sidebar-link",
                (pathname === item.href || 
                 (item.href && pathname.startsWith(`${item.href}/`))) && "active"
              )}
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              <span>{item.title}</span>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
} 