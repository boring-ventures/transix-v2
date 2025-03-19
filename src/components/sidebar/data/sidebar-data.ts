import {
  Bus,
  Command,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  Ticket,
  Users,
  Building,
  CreditCard,
  User,
  List,
  ShoppingCart,
  Route,
  BusFront,
  FileSpreadsheet,
  BarChart,
} from "lucide-react";
import type { SidebarData } from "../types";
import { Role } from "@prisma/client";

export const sidebarData: SidebarData = {
  user: {
    name: "admin",
    email: "admin@transix.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "TRANSIX",
      logo: Command,
      plan: "Sistema de Transporte",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Panel Principal",
          url: "/dashboard",
          icon: LayoutDashboard,
          requiredRole: [
            Role.superadmin,
            Role.company_admin,
            Role.branch_admin,
            Role.seller,
          ],
        },
        {
          title: "Tickets",
          url: "/dashboard/tickets",
          icon: Ticket,
          requiredRole: [
            Role.superadmin,
            Role.company_admin,
            Role.branch_admin,
            Role.seller,
          ],
          items: [
            {
              title: "Vender Tickets",
              url: "/dashboard/tickets/sales",
              icon: ShoppingCart,
              requiredRole: [
                Role.superadmin,
                Role.company_admin,
                Role.branch_admin,
                Role.seller,
              ],
            },
            {
              title: "Reportes de Ventas",
              url: "/dashboard/tickets/reports",
              icon: BarChart,
              requiredRole: [
                Role.superadmin,
                Role.company_admin,
                Role.branch_admin,
                Role.seller,
              ],
            },
          ],
        },
        {
          title: "Viajes",
          url: "/dashboard/schedules",
          icon: Bus,
          requiredRole: [
            Role.superadmin,
            Role.company_admin,
            Role.branch_admin,
            Role.seller,
          ],
          items: [
            {
              title: "Lista de Viajes",
              url: "/dashboard/schedules",
              icon: List,
              requiredRole: [
                Role.superadmin,
                Role.company_admin,
                Role.branch_admin,
                Role.seller,
              ],
            },
          ],
        },
        {
          title: "Rutas",
          url: "/dashboard/routes",
          icon: MapIcon,
          requiredRole: [Role.superadmin, Role.company_admin],
          items: [
            {
              title: "Lista de Rutas",
              url: "/dashboard/routes/list",
              icon: Route,
              requiredRole: [Role.superadmin, Role.company_admin],
            },
            {
              title: "Ubicaciones",
              url: "/dashboard/locations",
              icon: MapPin,
              requiredRole: [
                Role.superadmin,
                Role.company_admin,
                Role.branch_admin,
              ],
            },
          ],
        },

        {
          title: "Buses",
          url: "/dashboard/buses",
          icon: BusFront,
          requiredRole: [Role.superadmin, Role.company_admin],
          items: [
            {
              title: "Lista de Buses",
              url: "/dashboard/buses",
              icon: List,
              requiredRole: [Role.superadmin, Role.company_admin],
            },
            {
              title: "Plantillas",
              url: "/dashboard/bus-templates",
              icon: FileSpreadsheet,
              requiredRole: [Role.superadmin, Role.company_admin],
            },
          ],
        },
        {
          title: "Conductores",
          url: "/dashboard/drivers",
          icon: User,
          requiredRole: [Role.superadmin, Role.company_admin],
        },
        {
          title: "Usuarios",
          url: "/dashboard/profiles",
          icon: Users,
          requiredRole: [Role.superadmin, Role.company_admin],
        },
        {
          title: "Empresas",
          url: "/dashboard/companies",
          icon: Building,
          requiredRole: [Role.superadmin],
        },
        {
          title: "Finanzas",
          url: "/dashboard/finances",
          icon: CreditCard,
          requiredRole: [Role.superadmin, Role.company_admin],
        },
      ],
    },
  ],
};
