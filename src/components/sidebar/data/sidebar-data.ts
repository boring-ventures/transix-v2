import {
  AlertCircle,
  AppWindow,
  Ban,
  BellRing,
  Bus,
  CheckSquare,
  Command,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Map,
  MapPin,
  MessageSquare,
  Settings,
  Ticket,
  Users,
  Building,
  CreditCard,
  User,
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
          url: "/",
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
            },
            {
              title: "Lista de Tickets",
              url: "/tickets/list",
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
            },
          ],
        },
        {
          title: "Rutas",
          url: "/routes",
          icon: Map,
          items: [
            {
              title: "Lista de Rutas",
              url: "/routes/list",
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
          icon: Bus,
          items: [
            {
              title: "Lista de Buses",
              url: "/buses/list",
            },
          ],
        },
        {
          title: "Plantillas",
          url: "/templates",
          icon: FileText,
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
