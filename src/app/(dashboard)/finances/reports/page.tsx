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
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

// This would be in an actual component file in a real app
const FinanceChart = ({ data }: { data: any[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos vs Gastos</CardTitle>
        <CardDescription>
          Comparativa de ingresos y gastos en el período seleccionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `Bs ${value.toFixed(2)}`,
                  undefined,
                ]}
              />
              <Legend />
              <Bar name="Ingresos" dataKey="income" fill="#10b981" />
              <Bar name="Gastos" dataKey="expenses" fill="#ef4444" />
              <Bar name="Neto" dataKey="net" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// This would be in an actual component file in a real app
const TrendChart = ({ data }: { data: any[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Liquidaciones</CardTitle>
        <CardDescription>
          Evolución de liquidaciones en el tiempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `Bs ${value.toFixed(2)}`,
                  undefined,
                ]}
              />
              <Legend />
              <Line
                name="Ingresos"
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                activeDot={{ r: 8 }}
              />
              <Line
                name="Gastos"
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
              />
              <Line
                name="Neto"
                type="monotone"
                dataKey="net"
                stroke="#6366f1"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default function FinanceReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [financeData, setFinanceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const fetchFinanceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would be an API call in a real app
      // Mock data for demonstration
      setTimeout(() => {
        const mockChartData = Array.from({ length: 10 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (9 - i));
          const income = 1000 + Math.random() * 1000;
          const expenses = 500 + Math.random() * 500;
          return {
            date: format(date, "dd/MM"),
            income,
            expenses,
            net: income - expenses,
          };
        });

        const mockTopRoutes = [
          {
            routeName: "CB-POTOSI",
            totalIncome: 12560.5,
            totalExpenses: 3450.25,
            netAmount: 9110.25,
            liquidations: 12,
          },
          {
            routeName: "TARIJA-POTOSI",
            totalIncome: 9860.75,
            totalExpenses: 2780.5,
            netAmount: 7080.25,
            liquidations: 9,
          },
          {
            routeName: "SUCRE-POTOSI",
            totalIncome: 8450.25,
            totalExpenses: 2320.75,
            netAmount: 6129.5,
            liquidations: 8,
          },
          {
            routeName: "ORURO-POTOSI",
            totalIncome: 7890.5,
            totalExpenses: 2120.25,
            netAmount: 5770.25,
            liquidations: 7,
          },
        ];

        const mockTopBuses = [
          {
            plateNumber: "1651-ITL",
            busType: "MERCEDES BENZ",
            totalIncome: 8560.5,
            totalExpenses: 2250.25,
            netAmount: 6310.25,
            liquidations: 8,
          },
          {
            plateNumber: "1789-KDD",
            busType: "SCANIA",
            totalIncome: 7860.75,
            totalExpenses: 1980.5,
            netAmount: 5880.25,
            liquidations: 7,
          },
          {
            plateNumber: "1234-ABC",
            busType: "VOLVO",
            totalIncome: 6450.25,
            totalExpenses: 1720.75,
            netAmount: 4729.5,
            liquidations: 6,
          },
          {
            plateNumber: "9876-XYZ",
            busType: "MERCEDES BENZ",
            totalIncome: 5890.5,
            totalExpenses: 1520.25,
            netAmount: 4370.25,
            liquidations: 5,
          },
        ];

        const mockData = {
          summary: {
            totalIncome: 38761.5,
            totalExpenses: 10671.75,
            netAmount: 28089.75,
            totalLiquidations: 36,
            pendingLiquidations: 5,
            averageNet: 780.27,
          },
          chartData: mockChartData,
          topRoutes: mockTopRoutes,
          topBuses: mockTopBuses,
        };

        setFinanceData(mockData);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error fetching finance data:", error);
      setError(error instanceof Error ? error.message : "Error fetching data");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [dateRange]);

  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin"]}
    >
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Reportes Financieros
            </h1>
            <p className="text-muted-foreground">
              Visualiza estadísticas y tendencias financieras
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
              onClick={fetchFinanceData}
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
                onClick={fetchFinanceData}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Bs {financeData?.summary.totalIncome.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En el período seleccionado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gastos Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Bs {financeData?.summary.totalExpenses.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En el período seleccionado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Balance Neto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Bs {financeData?.summary.netAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Promedio por liquidación: Bs{" "}
                    {financeData?.summary.averageNet.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <FinanceChart data={financeData?.chartData || []} />

            <Tabs defaultValue="trend" className="space-y-4">
              <TabsList>
                <TabsTrigger value="trend">Tendencia</TabsTrigger>
                <TabsTrigger value="routes">Por Rutas</TabsTrigger>
                <TabsTrigger value="buses">Por Buses</TabsTrigger>
              </TabsList>

              <TabsContent value="trend" className="space-y-4">
                <TrendChart data={financeData?.chartData || []} />
              </TabsContent>

              <TabsContent value="routes">
                <Card>
                  <CardHeader>
                    <CardTitle>Desempeño por Rutas</CardTitle>
                    <CardDescription>
                      Análisis financiero por rutas en el período seleccionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Ruta
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Ingresos
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Gastos
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Neto
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Liquidaciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {financeData?.topRoutes.map((route: any) => (
                            <tr key={route.routeName}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {route.routeName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                Bs {route.totalIncome.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                Bs {route.totalExpenses.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                Bs {route.netAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {route.liquidations}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="buses">
                <Card>
                  <CardHeader>
                    <CardTitle>Desempeño por Buses</CardTitle>
                    <CardDescription>
                      Análisis financiero por buses en el período seleccionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Placa/Bus
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Ingresos
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Gastos
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Neto
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Liquidaciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {financeData?.topBuses.map((bus: any) => (
                            <tr key={bus.plateNumber}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {bus.plateNumber}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {bus.busType}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                Bs {bus.totalIncome.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                Bs {bus.totalExpenses.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                Bs {bus.netAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {bus.liquidations}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
