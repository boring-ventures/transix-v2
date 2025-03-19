"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SalesInsightsProps {
  salesData: any;
}

export default function SalesInsights({ salesData }: SalesInsightsProps) {
  if (!salesData) {
    return null;
  }

  // Calculate insights
  const topRouteRevenue =
    salesData.topRoutes?.length > 0 ? salesData.topRoutes[0].totalSales : 0;

  const topSellerRevenue =
    salesData.topSellers?.length > 0 ? salesData.topSellers[0].totalSales : 0;

  const topSellerName =
    salesData.topSellers?.length > 0 ? salesData.topSellers[0].fullName : "N/A";

  const topRouteName =
    salesData.topRoutes?.length > 0
      ? `${salesData.topRoutes[0].origin} → ${salesData.topRoutes[0].destination}`
      : "N/A";

  // Calculate days with high sales
  const highSalesDays = salesData.salesByDay
    ? salesData.salesByDay
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 3)
    : [];

  // Calculate performance metrics
  const averageTicketsPerDay =
    salesData.salesByDay && salesData.salesByDay.length > 0
      ? salesData.totalTickets / salesData.salesByDay.length
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Top Ruta</CardTitle>
          <CardDescription>Ruta con mayor ingreso de ventas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{topRouteName}</div>
          <p className="text-muted-foreground">
            ${topRouteRevenue.toFixed(2)} en ventas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Vendedor</CardTitle>
          <CardDescription>Vendedor con mayor ingreso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{topSellerName}</div>
          <p className="text-muted-foreground">
            ${topSellerRevenue.toFixed(2)} en ventas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promedio Diario</CardTitle>
          <CardDescription>Tickets vendidos por día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageTicketsPerDay.toFixed(1)} tickets
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Días con Mayor Venta</CardTitle>
          <CardDescription>
            Los días con mayor ingreso por ventas de tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {highSalesDays.map((day: any) => (
              <div key={day.date} className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {new Date(day.date).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  ${Number(day.total).toFixed(2)}
                  <span className="text-xs text-muted-foreground block text-right">
                    {day.count} tickets
                  </span>
                </div>
              </div>
            ))}
            {highSalesDays.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No hay datos de ventas diarias disponibles.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
