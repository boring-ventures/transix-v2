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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import TicketSalesTable from "../components/ticket-sales-table";
import SalesInsights from "../components/sales-insights";
import SalesChart from "../components/sales-chart";

export default function TicketReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const fetchSalesData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = "/api/tickets/reports";

      if (dateRange?.from && dateRange?.to) {
        url += `?startDate=${format(dateRange.from, "yyyy-MM-dd")}&endDate=${format(dateRange.to, "yyyy-MM-dd")}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch sales data");
      }

      const data = await response.json();
      setSalesData(data);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch sales data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin", "seller"]}
    >
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Reportes de Ventas de Tickets
            </h1>
            <p className="text-muted-foreground">
              Visualice las estadísticas y tendencias de ventas de tickets
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DatePickerWithRange
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={fetchSalesData}
              disabled={isLoading}
              title="Actualizar datos"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={fetchSalesData}
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
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
                    Total de Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${Number(salesData?.totalSalesAmount || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {salesData?.totalTickets || 0} tickets vendidos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Venta Promedio por Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {salesData?.salesByDay?.length > 0
                      ? "$" +
                        (
                          Number(salesData.totalSalesAmount || 0) /
                          salesData.salesByDay.length
                        ).toFixed(2)
                      : "$0.00"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Precio Promedio por Ticket
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {salesData?.totalTickets
                      ? "$" +
                        (
                          Number(salesData.totalSalesAmount || 0) /
                          salesData.totalTickets
                        ).toFixed(2)
                      : "$0.00"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Días con Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {salesData?.salesByDay?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Visión General</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="routes">Rutas</TabsTrigger>
                <TabsTrigger value="sellers">Vendedores</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <SalesChart salesByDay={salesData?.salesByDay || []} />
                <SalesInsights salesData={salesData} />
              </TabsContent>
              <TabsContent value="tickets">
                <Card>
                  <CardHeader>
                    <CardTitle>Tickets Vendidos</CardTitle>
                    <CardDescription>
                      Lista de tickets vendidos en el período seleccionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TicketSalesTable dateRange={dateRange} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="routes">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Rutas</CardTitle>
                    <CardDescription>
                      Las rutas con más ventas de tickets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {salesData?.topRoutes?.map(
                        (route: any, index: number) => (
                          <div
                            key={route.scheduleId}
                            className="flex items-center"
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {route.origin} → {route.destination}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {route.departureDate
                                  ? format(
                                      new Date(route.departureDate),
                                      "dd MMM yyyy HH:mm"
                                    )
                                  : "Fecha no disponible"}
                              </p>
                            </div>
                            <div className="ml-auto font-medium">
                              ${Number(route.totalSales || 0).toFixed(2)}
                            </div>
                          </div>
                        )
                      )}

                      {(!salesData?.topRoutes ||
                        salesData.topRoutes.length === 0) && (
                        <p className="text-center text-muted-foreground py-4">
                          No hay datos de rutas disponibles para el período
                          seleccionado
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="sellers">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Vendedores</CardTitle>
                    <CardDescription>
                      Los vendedores con más ventas de tickets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {salesData?.topSellers?.map((seller: any) => (
                        <div
                          key={seller.profileId}
                          className="flex items-center"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {seller.fullName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {seller.companyName} - {seller.branchName}
                            </p>
                          </div>
                          <div className="ml-auto font-medium">
                            ${Number(seller.totalSales || 0).toFixed(2)}
                            <span className="text-xs text-muted-foreground block text-right">
                              {seller.ticketCount} tickets
                            </span>
                          </div>
                        </div>
                      ))}

                      {(!salesData?.topSellers ||
                        salesData.topSellers.length === 0) && (
                        <p className="text-center text-muted-foreground py-4">
                          No hay datos de vendedores disponibles para el período
                          seleccionado
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ConditionalUI>
  );
}
