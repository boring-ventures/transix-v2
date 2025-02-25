"use client";

import { useState } from "react";
import { useSchedules, type Schedule } from "@/hooks/use-schedules";
import { DataTable } from "@/components/table/data-table";
import { LoadingTable } from "@/components/table/loading-table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreateScheduleDialog } from "./create-schedule-dialog";
import type { Column } from "@/components/table/types";

interface RouteSchedulesProps {
  routeId: string;
}

export function RouteSchedules({ routeId }: RouteSchedulesProps) {
  const { schedules, isLoadingSchedules } = useSchedules({ routeId });
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP", { locale: es });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: es });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Programado</Badge>;
      case "in_progress":
        return <Badge variant="default">En Progreso</Badge>;
      case "completed":
        return <Badge variant="default">Completado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "delayed":
        return <Badge variant="secondary">Retrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const columns: Column<Schedule>[] = [
    {
      id: "departureDate",
      header: "Fecha",
      accessorKey: "departureDate",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {formatDate(row.departureDate)}
        </div>
      ),
      sortable: true,
    },
    {
      id: "departureTime",
      header: "Hora Salida",
      accessorKey: "departureDate",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          {formatTime(row.departureDate)}
        </div>
      ),
      sortable: true,
    },
    {
      id: "bus",
      header: "Bus",
      accessorKey: "bus.plateNumber",
      cell: ({ row }) => row.bus?.plateNumber || "-",
      sortable: true,
    },
    {
      id: "driver",
      header: "Conductor",
      accessorKey: "primaryDriver.fullName",
      cell: ({ row }) => row.primaryDriver?.fullName || "-",
      sortable: true,
    },
    {
      id: "status",
      header: "Estado",
      accessorKey: "status",
      cell: ({ row }) => getStatusBadge(row.status),
      sortable: true,
    },
    {
      id: "tickets",
      header: "Boletos",
      accessorKey: "_count.tickets",
      cell: ({ row }) => row._count?.tickets || 0,
      sortable: true,
    },
  ];

  return (
    <div>
      {isLoadingSchedules ? (
        <LoadingTable columnCount={6} rowCount={5} />
      ) : (
        <DataTable
          data={schedules}
          columns={columns}
          searchable={false}
          defaultSort={{ field: "departureDate", direction: "desc" }}
          onAdd={() => setShowCreateDialog(true)}
          onRowClick={(schedule) => {
            window.location.href = `/schedules/${schedule.id}`;
          }}
        />
      )}

      <CreateScheduleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        routeId={routeId}
      />
    </div>
  );
} 