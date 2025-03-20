"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/table/data-table";
import { DeleteBusDialog } from "./delete-bus-dialog";
import type { Column } from "@/components/table/types";
import type { Bus } from "@/hooks/use-buses";
import type { MatrixSeat } from "@/hooks/use-bus-seats";

interface BusesTableProps {
  data: Bus[];
  title: string;
  description: string;
  onAdd: () => void;
  isCompanyRestricted?: boolean;
}

export function BusesTable({
  data,
  title,
  description,
  onAdd,
  isCompanyRestricted = false,
}: BusesTableProps) {
  const router = useRouter();
  const [busToDelete, setBusToDelete] = useState<string | null>(null);

  // Helper function to calculate active seats for a bus
  const calculateActiveSeats = (bus: Bus): number => {
    // If we have the busSeats array with active status
    if (bus.busSeats && bus.busSeats.length > 0) {
      return bus.busSeats.filter((seat) => seat.isActive).length;
    }

    // Otherwise calculate from the seat matrix
    let totalSeats = 0;

    if (bus.seatMatrix?.firstFloor) {
      totalSeats += bus.seatMatrix.firstFloor.seats.filter(
        (seat: MatrixSeat) => !seat.isEmpty
      ).length;
    }

    if (bus.seatMatrix?.secondFloor) {
      totalSeats += bus.seatMatrix.secondFloor.seats.filter(
        (seat: MatrixSeat) => !seat.isEmpty
      ).length;
    }

    return totalSeats;
  };

  const columns: Column<Bus>[] = [
    {
      id: "plateNumber",
      header: "Placa",
      accessorKey: "plateNumber",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.plateNumber}</div>
          {!isCompanyRestricted && (
            <div className="text-sm text-muted-foreground">
              {row.company?.name || "Sin empresa"}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "template",
      header: "Plantilla",
      accessorFn: (row) => row.template?.name || "Sin plantilla",
      cell: ({ getValue }) => {
        const value = getValue?.() as string | undefined;
        return <div>{value || "Sin plantilla"}</div>;
      },
    },
    {
      id: "seats",
      header: "Asientos",
      accessorFn: (row) => calculateActiveSeats(row),
      cell: ({ row }) => (
        <div className="text-center">{calculateActiveSeats(row)}</div>
      ),
    },
    {
      id: "maintenanceStatus",
      header: "Estado",
      accessorKey: "maintenanceStatus",
      cell: ({ row }) => {
        const status = row.maintenanceStatus;
        return (
          <Badge
            variant={
              status === "active"
                ? "default"
                : status === "in_maintenance"
                  ? "outline"
                  : "secondary"
            }
          >
            {status === "active" && "Operativo"}
            {status === "in_maintenance" && "En Mantenimiento"}
            {status === "retired" && "Retirado"}
          </Badge>
        );
      },
    },
    {
      id: "isActive",
      header: "Activo",
      accessorKey: "isActive",
      cell: ({ row }) => {
        const isActive = row.isActive;
        return (
          <Badge variant={isActive ? "outline" : "secondary"}>
            {isActive ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        title={title}
        description={description}
        data={data}
        columns={columns}
        searchable={true}
        searchField="plateNumber"
        rowSelection={false}
        onRowClick={(row) => router.push(`/buses/${row.id}`)}
        onAdd={onAdd}
        onDelete={(row) => setBusToDelete(row.id)}
        customActions={[
          {
            label: "Ver",
            onClick: (row) => router.push(`/buses/${row.id}`),
          },
          {
            label: "Editar",
            onClick: (row) => router.push(`/buses/${row.id}/edit`),
          },
        ]}
      />

      <DeleteBusDialog
        busId={busToDelete}
        onClose={() => setBusToDelete(null)}
      />
    </>
  );
}
