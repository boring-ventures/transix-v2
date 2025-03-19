"use client";

import { ConditionalUI } from "@/components/auth/ConditionalUI";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronRight, LineChart, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function TicketsPage() {
  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin", "seller"]}
    >
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            Gestión y reportes de venta de tickets
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Venta de Tickets</CardTitle>
                  <CardDescription>
                    Venta de tickets para los diferentes horarios y rutas
                  </CardDescription>
                </div>
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Venda tickets a los clientes, seleccionando la ruta, horario y
                asiento deseado. Registre los datos del cliente y genere el
                ticket de forma rápida y sencilla.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/dashboard/tickets/sales">
                  Ir a Ventas <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reportes de Ventas</CardTitle>
                  <CardDescription>
                    Estadísticas e insights sobre las ventas de tickets
                  </CardDescription>
                </div>
                <LineChart className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualice las estadísticas de ventas, identifique las rutas más
                populares, analice el desempeño de ventas por día y obtenga
                insights valiosos sobre su negocio.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/tickets/reports">
                  Ver Reportes <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ConditionalUI>
  );
}
