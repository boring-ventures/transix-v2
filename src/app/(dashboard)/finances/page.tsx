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
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Plus,
  Printer,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useFinances } from "@/hooks/use-finances";

interface Settlement {
  id: string;
  settledAt: string;
  status: string;
  routeName?: string;
  plateNumber?: string;
  busType?: string;
  ownerName?: string;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
  schedule?: {
    routeSchedule?: {
      route?: {
        origin?: {
          name?: string;
        };
        destination?: {
          name?: string;
        };
      };
    };
    bus?: {
      plateNumber?: string;
      template?: {
        name?: string;
      };
      company?: {
        name?: string;
      };
    };
    primaryDriver?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

interface FormattedSettlement {
  id: string;
  settledAt: string;
  routeName: string;
  plateNumber: string;
  busType: string;
  ownerName: string;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  status: string;
}

interface FinancialSummaryData {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

interface ExpenseDistributionData {
  name: string;
  value: number;
}

interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  pendingSettlements: number;
  completedTrips: number;
  pendingLiquidations: number;
  completedLiquidations: number;
  recentTrips: any[]; // This would need a more specific type if we knew the structure
}

const getLiquidationStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
    case "completed":
      return "bg-green-100 text-green-800 hover:bg-green-100/80";
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-100/80";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
  }
};

const formatSettlements = (
  settlements: Settlement[]
): FormattedSettlement[] => {
  return settlements.map((settlement) => {
    const schedule = settlement.schedule || {};
    const routeSchedule = schedule.routeSchedule || {};
    const route = routeSchedule.route || {};
    const bus = schedule.bus || {};
    const template = bus.template || {};
    const company = bus.company || {};

    // Get origin and destination names, handling optional chaining correctly
    const originName = route.origin?.name || "N/A";
    const destinationName = route.destination?.name || "N/A";
    const routeDisplay =
      originName !== "N/A" && destinationName !== "N/A"
        ? `${originName} - ${destinationName}`
        : "N/A";

    return {
      id: settlement.id,
      settledAt: settlement.settledAt,
      routeName: settlement.routeName || routeDisplay,
      plateNumber: settlement.plateNumber || bus.plateNumber || "N/A",
      busType: settlement.busType || template?.name || "N/A",
      ownerName: settlement.ownerName || company?.name || "N/A",
      totalIncome:
        typeof settlement.totalIncome === "number" ? settlement.totalIncome : 0,
      totalExpenses:
        typeof settlement.totalExpenses === "number"
          ? settlement.totalExpenses
          : 0,
      netAmount:
        typeof settlement.netAmount === "number" ? settlement.netAmount : 0,
      status: settlement.status || "PENDING",
    };
  });
};

// Financial summary chart component
const FinanceSummaryChart = ({ data }: { data: FinancialSummaryData[] }) => {
  return (
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
            formatter={(value: number) => [`Bs ${value.toFixed(2)}`, undefined]}
          />
          <Legend />
          <Bar name="Ingresos" dataKey="income" fill="#10b981" />
          <Bar name="Gastos" dataKey="expenses" fill="#ef4444" />
          <Bar name="Neto" dataKey="net" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Expense distribution chart component
const ExpenseDistributionChart = ({
  data,
}: {
  data: ExpenseDistributionData[];
}) => {
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#83a6ed",
  ];

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`Bs ${value.toFixed(2)}`, undefined]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function FinancesDashboardPage() {
  const {
    financeStats,
    isLoading: isFinancesLoading,
    error: financesError,
    fetchMonthlyData,
    fetchExpenseDistribution,
  } = useFinances();

  // Liquidations state
  const [liquidations, setLiquidations] = useState<FormattedSettlement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDateFilter] = useState("");
  const [endDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "settledAt",
    dir: "desc",
  });
  const [searchTerm] = useState("");
  const [isLiquidationsLoading, setIsLiquidationsLoading] = useState(false);

  // Real expense data from API
  const [expenseCategories, setExpenseCategories] = useState<
    ExpenseDistributionData[]
  >([]);
  const [monthlyData, setMonthlyData] = useState<FinancialSummaryData[]>([]);
  const [expenseTimeframe, setExpenseTimeframe] = useState<
    "week" | "month" | "year"
  >("month");
  const [timeframeLoading, setTimeframeLoading] = useState(false);

  const { toast } = useToast();

  // Fetch expense distribution data
  useEffect(() => {
    async function fetchExpenseData() {
      try {
        setTimeframeLoading(true);
        const data = await fetchExpenseDistribution(expenseTimeframe);
        setExpenseCategories(data);
      } catch (err) {
        console.error("Error fetching expense distribution:", err);
        toast({
          title: "Error",
          description: "No se pudo obtener la distribución de gastos",
          variant: "destructive",
        });
      } finally {
        setTimeframeLoading(false);
      }
    }

    fetchExpenseData();
  }, [expenseTimeframe, fetchExpenseDistribution, toast]);

  // Fetch monthly financial data
  useEffect(() => {
    async function fetchMonthlyFinancialData() {
      try {
        const data = await fetchMonthlyData(6);
        setMonthlyData(data);
      } catch (err) {
        console.error("Error fetching monthly financial data:", err);
        toast({
          title: "Error",
          description: "No se pudo obtener los datos financieros mensuales",
          variant: "destructive",
        });
      }
    }

    fetchMonthlyFinancialData();
  }, [fetchMonthlyData, toast]);

  const fetchLiquidations = async (
    page = currentPage,
    limit = itemsPerPage,
    sortBy = sortConfig.key,
    sortOrder = sortConfig.dir
  ) => {
    setIsLiquidationsLoading(true);
    try {
      const response = await fetch(
        `/api/finances/trip-settlements?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${
          statusFilter && statusFilter !== "all"
            ? `&status=${statusFilter}`
            : ""
        }${startDateFilter ? `&startDate=${startDateFilter}` : ""}${
          endDateFilter ? `&endDate=${endDateFilter}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch trip settlements");
      }

      const responseData = await response.json();

      // Set pagination data
      setTotalPages(responseData.pagination?.totalPages || 1);

      // Map the data and set liquidations
      const mappedData = formatSettlements(responseData.data);
      setLiquidations(mappedData);
    } catch (error) {
      console.error("Error fetching trip settlements:", error);
      toast({
        title: "Error",
        description: "No se pudieron obtener los arreglos de viaje",
        variant: "destructive",
      });
    } finally {
      setIsLiquidationsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiquidations();
  }, [
    statusFilter,
    startDateFilter,
    endDateFilter,
    currentPage,
    itemsPerPage,
    sortConfig.key,
    sortConfig.dir,
  ]);

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.dir === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, dir: direction });
  };

  const filteredLiquidations = liquidations.filter(
    (liquidation) =>
      searchTerm === "" ||
      (liquidation.routeName &&
        liquidation.routeName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (liquidation.plateNumber &&
        liquidation.plateNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (liquidation.ownerName &&
        liquidation.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin"]}
      showAccessDenied={true}
      message="No tienes permisos para acceder a las finanzas."
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

        {financesError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
            {typeof financesError === "string"
              ? financesError
              : "Error loading finance data"}
          </div>
        )}

        {isFinancesLoading && !financeStats ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : financesError ? (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {typeof financesError === "string"
              ? financesError
              : "Error loading finance data"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen Financiero</CardTitle>
                      <CardDescription>
                        Ingresos, gastos y balance neto mensual
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!monthlyData || monthlyData.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px]">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <FinanceSummaryChart data={monthlyData} />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Viajes Recientes</CardTitle>
                      <CardDescription>
                        Últimos viajes y sus resultados financieros
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!financeStats?.recentTrips ||
                      financeStats.recentTrips.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px]">
                          <p className="text-muted-foreground">
                            No hay viajes recientes registrados
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {financeStats.recentTrips.map((trip: any) => (
                            <div key={trip.id} className="flex items-center">
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                  {trip.route}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(trip.date),
                                    "dd/MM/yyyy HH:mm"
                                  )}
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
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="liquidations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle>Liquidaciones</CardTitle>
                        <CardDescription>
                          Gestiona todas las liquidaciones de viajes
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href="/finances/liquidations/print">
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/finances/liquidations/export">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="flex-1">
                          <Label htmlFor="statusFilter">Estado</Label>
                          <Select
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value)}
                          >
                            <SelectTrigger id="statusFilter">
                              <SelectValue placeholder="Todos los estados" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="PENDING">Pendiente</SelectItem>
                              <SelectItem value="COMPLETED">
                                Completado
                              </SelectItem>
                              <SelectItem value="CANCELLED">
                                Cancelado
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          {/* Search functionality is disabled for now, we're using the searchTerm state directly */}
                        </div>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort("routeName")}
                              >
                                Ruta{" "}
                                {sortConfig.key === "routeName" &&
                                  (sortConfig.dir === "asc" ? (
                                    <ChevronUp className="inline h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="inline h-4 w-4" />
                                  ))}
                              </TableHead>
                              <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort("plateNumber")}
                              >
                                Vehículo{" "}
                                {sortConfig.key === "plateNumber" &&
                                  (sortConfig.dir === "asc" ? (
                                    <ChevronUp className="inline h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="inline h-4 w-4" />
                                  ))}
                              </TableHead>
                              <TableHead className="text-right">
                                Ingresos
                              </TableHead>
                              <TableHead className="text-right">
                                Gastos
                              </TableHead>
                              <TableHead className="text-right">Neto</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">
                                Acciones
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLiquidations.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="text-center h-24"
                                >
                                  No hay liquidaciones que coincidan con los
                                  filtros.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredLiquidations.map((liquidation) => (
                                <TableRow key={liquidation.id}>
                                  <TableCell className="font-medium">
                                    {liquidation.routeName}
                                  </TableCell>
                                  <TableCell>
                                    {liquidation.plateNumber}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    Bs {liquidation.totalIncome.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    Bs {liquidation.totalExpenses.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    Bs {liquidation.netAmount.toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={getLiquidationStatusColor(
                                        liquidation.status
                                      )}
                                    >
                                      {liquidation.status === "PENDING"
                                        ? "Pendiente"
                                        : liquidation.status === "COMPLETED"
                                          ? "Completado"
                                          : liquidation.status === "CANCELLED"
                                            ? "Cancelado"
                                            : liquidation.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                      <Link
                                        href={`/finances/liquidations/${liquidation.id}`}
                                      >
                                        Ver
                                      </Link>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex justify-center">
                          <Pagination>
                            <PaginationContent>
                              <PaginationPrevious
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    prev > 1 ? prev - 1 : prev
                                  )
                                }
                                aria-disabled={currentPage === 1}
                              />

                              {Array.from(
                                { length: Math.min(5, totalPages) },
                                (_, i) => {
                                  let pageNum = i + 1;
                                  if (totalPages > 5) {
                                    if (currentPage > 3) {
                                      pageNum = currentPage - 3 + i;
                                    }
                                    if (pageNum > totalPages) {
                                      pageNum = totalPages - (5 - i);
                                    }
                                  }
                                  return (
                                    <PaginationItem key={pageNum}>
                                      <PaginationLink
                                        onClick={() => setCurrentPage(pageNum)}
                                        isActive={currentPage === pageNum}
                                      >
                                        {pageNum}
                                      </PaginationLink>
                                    </PaginationItem>
                                  );
                                }
                              )}

                              {totalPages > 5 &&
                                currentPage < totalPages - 2 && (
                                  <>
                                    <PaginationEllipsis />
                                    <PaginationLink
                                      onClick={() => setCurrentPage(totalPages)}
                                    >
                                      {totalPages}
                                    </PaginationLink>
                                  </>
                                )}

                              <PaginationNext
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    prev < totalPages ? prev + 1 : prev
                                  )
                                }
                                aria-disabled={currentPage === totalPages}
                              />
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Análisis de Gastos</h2>
                  <div className="flex space-x-2">
                    <Button
                      variant={
                        expenseTimeframe === "week" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setExpenseTimeframe("week")}
                      disabled={timeframeLoading}
                    >
                      Semanal
                    </Button>
                    <Button
                      variant={
                        expenseTimeframe === "month" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setExpenseTimeframe("month")}
                      disabled={timeframeLoading}
                    >
                      Mensual
                    </Button>
                    <Button
                      variant={
                        expenseTimeframe === "year" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setExpenseTimeframe("year")}
                      disabled={timeframeLoading}
                    >
                      Anual
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribución de Gastos</CardTitle>
                      <CardDescription>
                        Distribución porcentual por categoría (
                        {expenseTimeframe === "week"
                          ? "últimos 7 días"
                          : expenseTimeframe === "month"
                            ? "último mes"
                            : "último año"}
                        )
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {timeframeLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                      ) : expenseCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center">
                          <p className="text-muted-foreground">
                            No hay datos de gastos para este período
                          </p>
                        </div>
                      ) : (
                        <ExpenseDistributionChart data={expenseCategories} />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Principales Gastos</CardTitle>
                      <CardDescription>
                        Gastos más significativos por categoría
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {timeframeLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                      ) : expenseCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center">
                          <p className="text-muted-foreground">
                            No hay datos de gastos para este período
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {expenseCategories.map((category, index) => (
                            <div key={index} className="flex items-center">
                              <div className="space-y-1 flex-1">
                                <p className="text-sm font-medium leading-none">
                                  {category.name}
                                </p>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-2 bg-primary"
                                    style={{
                                      width: `${Math.round((category.value / expenseCategories.reduce((acc, curr) => acc + curr.value, 0)) * 100)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <div className="ml-auto text-right">
                                <div className="font-medium">
                                  Bs {category.value.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {Math.round(
                                    (category.value /
                                      expenseCategories.reduce(
                                        (acc, curr) => acc + curr.value,
                                        0
                                      )) *
                                      100
                                  )}
                                  % del total
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ConditionalUI>
  );
}
