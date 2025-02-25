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
} from "lucide-react";
import type { SidebarData } from "../types";

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
        },
        {
          title: "Tickets",
          url: "/tickets",
          icon: Ticket,
          items: [
            {
              title: "Vender Tickets",
              url: "/tickets/sell",
              icon: ShoppingCart,
            },
            {
              title: "Lista de Tickets",
              url: "/tickets/list",
              icon: List,
            },
          ],
        },
        {
          title: "Viajes",
          url: "/trips",
          icon: Bus,
          items: [
            {
              title: "Lista de Viajes",
              url: "/trips/list",
              icon: List,
            },
          ],
        },
        {
          title: "Rutas",
          url: "/routes",
          icon: MapIcon,
          items: [
            {
              title: "Lista de Rutas",
              url: "/routes/list",
              icon: Route,
            },
          ],
        },
        {
          title: "Ubicaciones",
          url: "/locations",
          icon: MapPin,
        },
        {
          title: "Buses",
          url: "/buses",
          icon: BusFront,
          items: [
            {
              title: "Lista de Buses",
              url: "/buses/list",
              icon: List,
            },
          ],
        },
        {
          title: "Plantillas",
          url: "/templates",
          icon: FileSpreadsheet,
        },
        {
          title: "Conductores",
          url: "/drivers",
          icon: User,
        },
        {
          title: "Usuarios",
          url: "/users",
          icon: Users,
        },
        {
          title: "Empresas",
          url: "/companies",
          icon: Building,
        },
        {
          title: "Finanzas",
          url: "/finances",
          icon: CreditCard,
        },
      ],
    },
  ],
};
