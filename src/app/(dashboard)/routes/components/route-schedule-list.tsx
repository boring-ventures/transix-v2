"use client";

import { useState } from "react";
import {
  useRouteSchedules,
  type RouteSchedule,
} from "@/hooks/use-route-schedules";
import { DataTable } from "@/components/table/data-table";
import { LoadingTable } from "@/components/table/loading-table";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreateRouteScheduleDialog } from "./create-route-schedule-dialog";
import type { Column } from "@/components/table/types";

interface RouteScheduleListProps {
  routeId: string;
}

export function RouteScheduleList({ routeId }: RouteScheduleListProps) {
  const { routeSchedules, isLoadingRouteSchedules } = useRouteSchedules({
    routeId,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<RouteSchedule | null>(
    null
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: es });
  };

  const formatOperatingDays = (days: string) => {
    const dayMap: Record<string, string> = {
      "0": "Dom",
      "1": "Lun",
      "2": "Mar",
      "3": "Mié",
      "4": "Jue",
      "5": "Vie",
      "6": "Sáb",
    };

    return days
      .split(",")
      .map((day) => dayMap[day] || day)
      .join(", ");
  };

  const columns: Column<RouteSchedule>[] = [
    {
      id: "operatingDays",
      header: "Días",
      accessorKey: "operatingDays",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {formatOperatingDays(row.operatingDays)}
        </div>
      ),
      sortable: true,
    },
    {
      id: "departureTime",
      header: "Hora de Salida",
      accessorKey: "departureTime",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          {formatTime(row.departureTime)}
        </div>
      ),
      sortable: true,
    },
    {
      id: "estimatedArrivalTime",
      header: "Hora de Llegada",
      accessorKey: "estimatedArrivalTime",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          {formatTime(row.estimatedArrivalTime)}
        </div>
      ),
      sortable: true,
    },
    {
      id: "status",
      header: "Estado",
      accessorKey: "active",
      cell: ({ row }) => (
        <Badge variant={row.active ? "default" : "destructive"}>
          {row.active ? "Activo" : "Inactivo"}
        </Badge>
      ),
      sortable: true,
    },
  ];

  return (
    <div>
      {isLoadingRouteSchedules ? (
        <LoadingTable columnCount={4} rowCount={5} />
      ) : (
        <>
          <DataTable
            data={routeSchedules}
            columns={columns}
            searchable={false}
            defaultSort={{ field: "departureTime", direction: "asc" }}
            onAdd={() => setShowCreateDialog(true)}
            onEdit={(schedule) => setScheduleToEdit(schedule)}
          />
        </>
      )}

      <CreateRouteScheduleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        routeId={routeId}
      />

      {scheduleToEdit && (
        <CreateRouteScheduleDialog
          open={!!scheduleToEdit}
          onOpenChange={(open: boolean) => !open && setScheduleToEdit(null)}
          routeId={routeId}
          routeSchedule={scheduleToEdit}
        />
      )}
    </div>
  );
}
