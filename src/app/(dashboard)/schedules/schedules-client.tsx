"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSchedules } from "@/hooks/use-schedules";
import { type Route, useRoutes } from "@/hooks/use-routes";
import { type Bus, useBuses } from "@/hooks/use-buses";
import { type Driver, useDrivers } from "@/hooks/use-drivers";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfToday, endOfMonth, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Plus, Filter, X } from "lucide-react";
import { DataTable } from "@/components/table/data-table";
import { LoadingTable } from "@/components/table/loading-table";
import type { Column } from "@/components/table/types";
import type { Schedule, ScheduleStatus } from "@/types/schedule";

export default function SchedulesClient() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    routeId: "",
    busId: "",
    status: "",
    primaryDriverId: "",
    fromDate: startOfToday(),
    toDate: endOfMonth(addMonths(new Date(), 1)),
  });
  const [showFilters, setShowFilters] = useState(false);

  const { schedules, isLoadingSchedules } = useSchedules({
    routeId: filters.routeId || undefined,
    busId: filters.busId || undefined,
    status: (filters.status as ScheduleStatus) || undefined,
    primaryDriverId: filters.primaryDriverId || undefined,
    fromDate: filters.fromDate
      ? format(filters.fromDate, "yyyy-MM-dd")
      : undefined,
    toDate: filters.toDate ? format(filters.toDate, "yyyy-MM-dd") : undefined,
  });

  const { routes } = useRoutes();
  const { buses } = useBuses();
  const { drivers } = useDrivers();

  const handleCreateSchedule = () => {
    router.push("/schedules/create");
  };

  const handleViewSchedule = (id: string) => {
    router.push(`/schedules/${id}`);
  };

  const handleFilterChange = (key: string, value: string | Date | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      routeId: "",
      busId: "",
      status: "",
      primaryDriverId: "",
      fromDate: startOfToday(),
      toDate: endOfMonth(addMonths(new Date(), 1)),
    });
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "dd MMM yyyy", { locale: es });
  };

  const formatTime = (date: string | Date) => {
    return format(new Date(date), "HH:mm", { locale: es });
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    const statusConfig = {
      scheduled: { label: "Programado", variant: "outline" as const },
      in_progress: { label: "En Progreso", variant: "default" as const },
      completed: { label: "Completado", variant: "secondary" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
      delayed: { label: "Retrasado", variant: "default" as const },
    };

    const config = statusConfig[status] || statusConfig.scheduled;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Define columns for the DataTable
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const columns = useMemo<Column<Schedule>[]>(
    () => [
      {
        id: "route",
        header: "Ruta",
        accessorKey: "routeSchedule.route.name",
        cell: ({ row }) => row.routeSchedule?.route?.name || "Sin ruta",
      },
      {
        id: "date",
        header: "Fecha",
        accessorKey: "departureDate",
        cell: ({ row }) => formatDate(row.departureDate),
      },
      {
        id: "time",
        header: "Hora",
        accessorKey: "departureDate",
        cell: ({ row }) => formatTime(row.departureDate),
      },
      {
        id: "bus",
        header: "Bus",
        accessorKey: "bus.plateNumber",
        cell: ({ row }) => row.bus?.plateNumber || "Sin asignar",
      },
      {
        id: "driver",
        header: "Conductor",
        accessorKey: "primaryDriver.fullName",
        cell: ({ row }) => row.primaryDriver?.fullName || "Sin asignar",
      },
      {
        id: "status",
        header: "Estado",
        accessorKey: "status",
        cell: ({ row }) => getStatusBadge(row.status),
      },
    ],
    []
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Viajes Programados</h1>
        <Button onClick={handleCreateSchedule}>
          <Plus className="mr-2 h-4 w-4" />
          Programar Viaje
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>
          </div>
          <CardDescription>
            Busca y filtra los viajes programados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="route-filter" className="text-sm font-medium">
                  Ruta
                </label>
                <Select
                  value={filters.routeId}
                  onValueChange={(value) =>
                    handleFilterChange("routeId", value)
                  }
                >
                  <SelectTrigger id="route-filter">
                    <SelectValue placeholder="Todas las rutas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las rutas</SelectItem>
                    {routes.map((route: Route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="bus-filter" className="text-sm font-medium">
                  Bus
                </label>
                <Select
                  value={filters.busId}
                  onValueChange={(value) => handleFilterChange("busId", value)}
                >
                  <SelectTrigger id="bus-filter">
                    <SelectValue placeholder="Todos los buses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los buses</SelectItem>
                    {buses.map((bus: Bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.plateNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="status-filter" className="text-sm font-medium">
                  Estado
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="delayed">Retrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="driver-filter" className="text-sm font-medium">
                  Conductor
                </label>
                <Select
                  value={filters.primaryDriverId}
                  onValueChange={(value) =>
                    handleFilterChange("primaryDriverId", value)
                  }
                >
                  <SelectTrigger id="driver-filter">
                    <SelectValue placeholder="Todos los conductores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los conductores</SelectItem>
                    {drivers.map((driver: Driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="from-date" className="text-sm font-medium">
                  Desde
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="from-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.fromDate ? (
                        format(filters.fromDate, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.fromDate}
                      onSelect={(date) => handleFilterChange("fromDate", date || null)}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label htmlFor="to-date" className="text-sm font-medium">
                  Hasta
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="to-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.toDate ? (
                        format(filters.toDate, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.toDate}
                      onSelect={(date) => handleFilterChange("toDate", date || null)}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-full flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoadingSchedules ? (
        <LoadingTable columnCount={6} rowCount={10} />
      ) : (
        <DataTable
          title="Lista de Viajes"
          description={`${schedules.length} viajes encontrados`}
          data={schedules}
          columns={columns}
          searchable={true}
          defaultSort={{
            field: "departureDate" as keyof Schedule,
            direction: "asc",
          }}
          onRowClick={(row) => handleViewSchedule(row.id)}
          onAdd={handleCreateSchedule}
          customActions={[
            {
              label: "Ver Detalles",
              onClick: (row) => handleViewSchedule(row.id),
            },
          ]}
        />
      )}
    </div>
  );
}
