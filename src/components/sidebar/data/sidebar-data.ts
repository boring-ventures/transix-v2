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
          url: "/tickets",
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
              url: "/tickets/sales",
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
              url: "/tickets/reports",
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
          url: "/schedules",
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
              url: "/schedules",
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
          url: "/routes",
          icon: MapIcon,
          requiredRole: [Role.superadmin, Role.company_admin],
          items: [
            {
              title: "Lista de Rutas",
              url: "/routes/list",
              icon: Route,
              requiredRole: [Role.superadmin, Role.company_admin],
            },
            {
              title: "Ubicaciones",
              url: "/locations",
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
          url: "/buses",
          icon: BusFront,
          requiredRole: [Role.superadmin, Role.company_admin],
          items: [
            {
              title: "Lista de Buses",
              url: "/buses",
              icon: List,
              requiredRole: [Role.superadmin, Role.company_admin],
            },
            {
              title: "Plantillas",
              url: "/bus-templates",
              icon: FileSpreadsheet,
              requiredRole: [Role.superadmin, Role.company_admin],
            },
          ],
        },
        {
          title: "Conductores",
          url: "/drivers",
          icon: User,
          requiredRole: [Role.superadmin, Role.company_admin],
        },
        {
          title: "Usuarios",
          url: "/profiles",
          icon: Users,
          requiredRole: [Role.superadmin, Role.company_admin],
        },
        {
          title: "Empresas",
          url: "/companies",
          icon: Building,
          requiredRole: [Role.superadmin],
        },
        {
          title: "Finanzas",
          url: "/finances",
          icon: CreditCard,
          requiredRole: [Role.superadmin, Role.company_admin],
        },
      ],
    },
  ],
};
