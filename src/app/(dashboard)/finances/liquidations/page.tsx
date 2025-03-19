"use client";

import React, { useState, useEffect } from "react";
import { ConditionalUI } from "@/components/auth/ConditionalUI";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Plus,
  Printer,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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

const formatSettlements = (settlements) => {
  return settlements.map((settlement) => {
    // Log the first settlement for debugging
    if (settlements.indexOf(settlement) === 0) {
      console.log("Settlement:", settlement);
    }

    const schedule = settlement.schedule || {};
    const routeSchedule = schedule.routeSchedule || {};
    const route = routeSchedule.route || {};
    const bus = schedule.bus || {};
    const driver = schedule.primaryDriver || {};
    const template = bus.template || {};
    const company = bus.company || {};

    return {
      id: settlement.id,
      settledAt: settlement.settledAt,
      routeName:
        settlement.routeName ||
        (route.origin && route.destination
          ? `${route.origin.name} - ${route.destination.name}`
          : "N/A"),
      plateNumber: settlement.plateNumber || bus.plateNumber || "N/A",
      busType: settlement.busType || template.name || "N/A",
      ownerName: settlement.ownerName || company.name || "N/A",
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

export default function LiquidationsPage() {
  const [liquidations, setLiquidations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "settledAt",
    dir: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchLiquidations = async (
    page = currentPage,
    limit = itemsPerPage,
    sortBy = sortConfig.key,
    sortOrder = sortConfig.dir
  ) => {
    setIsLoading(true);
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
      setTotalItems(responseData.pagination?.total || 0);
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
      setIsLoading(false);
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
    >
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Liquidaciones</h1>
            <p className="text-muted-foreground">
              Gestiona las liquidaciones de viajes y calcula los balances
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/finances/liquidations/print">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/finances/liquidations/export">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Link>
            </Button>
            <Button asChild>
              <Link href="/finances/liquidations/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Liquidación
              </Link>
            </Button>
          </div>
        </div>

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
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label htmlFor="startDate">Fecha inicio</Label>
            <Input
              id="startDate"
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
            />
          </div>

          <div className="flex-1">
            <Label htmlFor="endDate">Fecha fin</Label>
            <Input
              id="endDate"
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
            />
          </div>

          <div className="flex-1 flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStartDateFilter("");
                setEndDateFilter("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="w-full"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Liquidaciones de Viajes</CardTitle>
            <CardDescription>
              Lista de todas las liquidaciones de viajes registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => handleSort("settledAt")}
                        >
                          Fecha
                          {sortConfig.key === "settledAt" &&
                            (sortConfig.dir === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => handleSort("routeName")}
                        >
                          Ruta
                          {sortConfig.key === "routeName" &&
                            (sortConfig.dir === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => handleSort("plateNumber")}
                        >
                          Placa/Bus
                          {sortConfig.key === "plateNumber" &&
                            (sortConfig.dir === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => handleSort("ownerName")}
                        >
                          Propietario
                          {sortConfig.key === "ownerName" &&
                            (sortConfig.dir === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div
                          className="flex items-center justify-end cursor-pointer"
                          onClick={() => handleSort("totalIncome")}
                        >
                          Ingreso
                          {sortConfig.key === "totalIncome" &&
                            (sortConfig.dir === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div
                          className="flex items-center justify-end cursor-pointer"
                          onClick={() => handleSort("totalExpenses")}
                        >
                          Gastos
                          {sortConfig.key === "totalExpenses" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div
                          className="flex items-center justify-end cursor-pointer"
                          onClick={() => handleSort("netAmount")}
                        >
                          Neto
                          {sortConfig.key === "netAmount" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLiquidations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center h-32 text-muted-foreground"
                        >
                          No se encontraron liquidaciones que coincidan con los
                          criterios de búsqueda
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLiquidations.map((liquidation) => (
                        <TableRow key={liquidation.id}>
                          <TableCell className="font-medium">
                            {liquidation.settledAt
                              ? format(
                                  new Date(liquidation.settledAt),
                                  "dd/MM/yyyy HH:mm"
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {liquidation.routeName || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{liquidation.plateNumber || "N/A"}</span>
                              <span className="text-xs text-muted-foreground">
                                {liquidation.busType || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {liquidation.ownerName || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            Bs {(liquidation.totalIncome || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            Bs {(liquidation.totalExpenses || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Bs {(liquidation.netAmount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getLiquidationStatusColor(
                                liquidation.status.toLowerCase()
                              )}
                            >
                              {liquidation.status === "PENDING" && "Pendiente"}
                              {liquidation.status === "COMPLETED" &&
                                "Completado"}
                              {liquidation.status === "CANCELLED" &&
                                "Cancelado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/finances/liquidations/${liquidation.id}`}
                                >
                                  Ver
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/finances/liquidations/${liquidation.id}/print`}
                                >
                                  <Printer className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                      }
                    }}
                    className={
                      currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current page
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    // If there's a gap, add ellipsis
                    const showEllipsisBefore =
                      index > 0 && array[index - 1] !== page - 1;
                    const showEllipsisAfter =
                      index < array.length - 1 && array[index + 1] !== page + 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                        {showEllipsisAfter && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                      </React.Fragment>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </ConditionalUI>
  );
}
