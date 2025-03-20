"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Bus,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  MapPin,
  User,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Type definitions
interface AnalyticsData {
  totalSales: number;
  totalPassengers: number;
  activeBuses: number;
  busesInRoute: number;
  busesInTerminal: number;
  totalParcels: number;
  deliveryPercentage: number;
  monthlySales: { month: string; total: number }[];
  topRoutes: {
    id: string;
    name: string;
    origin: { name: string };
    destination: { name: string };
    _count: { Trip: number };
  }[];
  upcomingDepartures: {
    id: string;
    departureDate: string;
    route: {
      name: string;
      origin: { name: string };
      destination: { name: string };
    };
    bus: { plateNumber: string };
  }[];
  driverStats: number;
}

interface DriverPerformance {
  topDrivers: {
    id: string;
    name: string;
    completedTrips: number;
    totalRevenue: number;
    onTimePercentage: number;
    averageRevenuePerTrip: number;
  }[];
  busUtilization: {
    id: string;
    plateNumber: string;
    maintenanceStatus: string;
    totalTrips: number;
    totalPassengers: number;
    averagePassengersPerTrip: number;
  }[];
}

interface RouteSales {
  id: string;
  name: string;
  originName: string;
  destinationName: string;
  routeDisplay: string;
  totalSales: number;
  totalTickets: number;
  averageTicketPrice: number;
}

// Color constants
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [driverPerformance, setDriverPerformance] =
    useState<DriverPerformance | null>(null);
  const [routeSales, setRouteSales] = useState<RouteSales[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);

        // Fetch general analytics
        const response = await fetch("/api/analytics");
        if (!response.ok) throw new Error("Failed to fetch analytics data");
        const data = await response.json();
        setAnalyticsData(data);

        // Fetch driver performance
        const driverResponse = await fetch("/api/analytics/driver-performance");
        if (!driverResponse.ok)
          throw new Error("Failed to fetch driver performance data");
        const driverData = await driverResponse.json();
        setDriverPerformance(driverData);

        // Fetch route sales
        const routeResponse = await fetch("/api/analytics/route-sales");
        if (!routeResponse.ok)
          throw new Error("Failed to fetch route sales data");
        const routeData = await routeResponse.json();
        setRouteSales(routeData);

        setError(null);
      } catch (err) {
        setError("Error fetching analytics data. Please try again later.");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Format monthly sales data for chart
  const formatMonthlySales = () => {
    if (!analyticsData?.monthlySales) return [];

    return analyticsData.monthlySales.map((item) => {
      const date = new Date(item.month);
      const monthNames = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      return {
        name: monthNames[date.getMonth()],
        ventas: Number(item.total),
      };
    });
  };

  // Format route sales for pie chart
  const formatRouteSalesForPie = () => {
    if (!routeSales) return [];

    return routeSales.slice(0, 5).map((route, index) => ({
      name: route.routeDisplay,
      value: route.totalSales,
    }));
  };

  // Format upcoming departures data
  const formatUpcomingDepartures = () => {
    if (!analyticsData?.upcomingDepartures) return [];

    return analyticsData.upcomingDepartures.map((departure) => {
      const departureDate = new Date(departure.departureDate);
      return {
        ...departure,
        formattedDate: departureDate.toLocaleDateString("es-ES"),
        formattedTime: departureDate.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        routeDisplay: `${departure.route.origin.name} → ${departure.route.destination.name}`,
      };
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Cargando métricas...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido al sistema de gestión de TRANSIX
          </p>
        </div>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <h2 className="text-lg font-medium">Error de carga</h2>
              <p>{error}</p>
            </div>
          </div>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  // Format percentages
  const formatGrowthPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value}%`;
  };

  // Formatted currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data for charts
  const monthlySalesData = formatMonthlySales();
  const routeSalesPieData = formatRouteSalesForPie();
  const upcomingDepartures = formatUpcomingDepartures();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión de TRANSIX
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData?.totalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatGrowthPercentage(20.1)} respecto al mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pasajeros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalPassengers?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatGrowthPercentage(15)} respecto al mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buses Activos</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.activeBuses || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.busesInRoute || 0} en ruta,{" "}
              {analyticsData?.busesInTerminal || 0} en terminal
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encomiendas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalParcels || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.deliveryPercentage || 98}% entregadas a tiempo
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="routes">Rutas</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ventas Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="ventas" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas por Ruta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        isAnimationActive={true}
                        data={routeSalesPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {routeSalesPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Ventas por Ruta</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Boletos Vendidos</TableHead>
                    <TableHead>Precio Promedio</TableHead>
                    <TableHead className="text-right">Total Ventas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routeSales?.slice(0, 5).map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">
                        {route.routeDisplay}
                      </TableCell>
                      <TableCell>{route.totalTickets}</TableCell>
                      <TableCell>
                        {formatCurrency(route.averageTicketPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(route.totalSales)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-right">
                <Link href="/routes">
                  <Button variant="outline" size="sm">
                    Ver todas las rutas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Salidas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Bus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingDepartures.map((departure) => (
                      <TableRow key={departure.id}>
                        <TableCell className="font-medium">
                          {departure.routeDisplay}
                        </TableCell>
                        <TableCell>{departure.formattedDate}</TableCell>
                        <TableCell>{departure.formattedTime}</TableCell>
                        <TableCell>{departure.bus.plateNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-right">
                  <Link href="/schedules">
                    <Button variant="outline" size="sm">
                      Ver todos los horarios
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rutas Más Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ruta</TableHead>
                      <TableHead className="text-right">Viajes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData?.topRoutes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">
                          {route.origin.name} → {route.destination.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {route._count.Trip}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-right">
                  <Link href="/routes">
                    <Button variant="outline" size="sm">
                      Ver todas las rutas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Conductores</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Viajes</TableHead>
                      <TableHead>Puntualidad</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverPerformance?.topDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">
                          {driver.name}
                        </TableCell>
                        <TableCell>{driver.completedTrips}</TableCell>
                        <TableCell>{driver.onTimePercentage}%</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(driver.totalRevenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-right">
                  <Link href="/drivers">
                    <Button variant="outline" size="sm">
                      Ver todos los conductores
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilización de Buses</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Viajes</TableHead>
                      <TableHead className="text-right">
                        Pasajeros Promedio
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverPerformance?.busUtilization.map((bus) => (
                      <TableRow key={bus.id}>
                        <TableCell className="font-medium">
                          {bus.plateNumber}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              bus.maintenanceStatus === "active"
                                ? "text-green-600"
                                : "text-amber-600"
                            }
                          >
                            {bus.maintenanceStatus === "active"
                              ? "Activo"
                              : "En Mantenimiento"}
                          </span>
                        </TableCell>
                        <TableCell>{bus.totalTrips}</TableCell>
                        <TableCell className="text-right">
                          {bus.averagePassengersPerTrip}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-right">
                  <Link href="/buses">
                    <Button variant="outline" size="sm">
                      Ver todos los buses
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
