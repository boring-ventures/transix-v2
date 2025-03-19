"use client";

import { useState, useEffect } from "react";
import { ConditionalUI } from "@/components/auth/ConditionalUI";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BanknoteIcon,
  ReceiptIcon,
  TruckIcon,
  ClipboardListIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function FinancesDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [financeStats, setFinanceStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFinancialData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/finances");

        if (!response.ok) {
          throw new Error("Failed to fetch financial data");
        }

        const data = await response.json();
        setFinanceStats(data);
      } catch (err) {
        console.error("Error fetching financial data:", err);
        setError("Error loading financial data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFinancialData();
  }, []);

  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin"]}
    >
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
            <p className="text-muted-foreground">
              Gestiona liquidaciones, gastos y reportes financieros
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/finances/liquidations/new">Nueva Liquidación</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos Totales
                  </CardTitle>
                  <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Bs {financeStats?.totalIncome.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium mr-1">
                      +12.5%
                    </span>
                    vs. mes anterior
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gastos Totales
                  </CardTitle>
                  <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Bs {financeStats?.totalExpenses.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <ArrowDownIcon className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium mr-1">
                      -8.2%
                    </span>
                    vs. mes anterior
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Liquidaciones Pendientes
                  </CardTitle>
                  <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {financeStats?.pendingLiquidations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {financeStats?.completedLiquidations} completadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Balance Neto
                  </CardTitle>
                  <TruckIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Bs {financeStats?.netAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium mr-1">
                      +5.3%
                    </span>
                    vs. mes anterior
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="liquidations">Liquidaciones</TabsTrigger>
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Viajes Recientes</CardTitle>
                    <CardDescription>
                      Últimos viajes y sus resultados financieros
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {financeStats?.recentTrips?.map((trip: any) => (
                        <div key={trip.id} className="flex items-center">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {trip.route}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(trip.date), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="font-medium">
                              Bs {trip.net.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <span className="text-green-600">
                                +{trip.income.toFixed(2)}
                              </span>{" "}
                              /
                              <span className="text-red-600">
                                -{trip.expenses.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="liquidations">
                <Card className="p-6">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <ClipboardListIcon className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">
                        Gestión de Liquidaciones
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                        Gestiona las liquidaciones de viajes, registra ingresos
                        y gastos, y genera reportes.
                      </p>
                    </div>
                    <Button asChild>
                      <Link href="/finances/liquidations">
                        Ver Liquidaciones
                      </Link>
                    </Button>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="expenses">
                <Card className="p-6">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <ReceiptIcon className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">Gestión de Gastos</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                        Registra y gestiona los gastos por viaje, categorías, y
                        analiza los costos.
                      </p>
                    </div>
                    <Button asChild>
                      <Link href="/finances/expenses">Ver Gastos</Link>
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ConditionalUI>
  );
}
