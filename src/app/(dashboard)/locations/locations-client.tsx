"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocations, type Location } from "@/hooks/use-locations";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/table/data-table";
import { LoadingTable } from "@/components/table/loading-table";
import { CreateLocationDialog } from "./components/create-location-dialog";
import { EditLocationDialog } from "./components/edit-location-dialog";
import { DeleteLocationDialog } from "./components/delete-location-dialog";
import type { Column } from "@/components/table/types";

export default function LocationsClient() {
  const router = useRouter();
  const { locations, isLoadingLocations } = useLocations();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  const handleViewLocation = (location: Location) => {
    router.push(`/locations/${location.id}`);
  };

  const columns: Column<Location>[] = [
    {
      id: "name",
      header: "Nombre",
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "routes",
      header: "Rutas",
      accessorKey: "_count",
      cell: ({ row }) => {
        const originCount = row._count?.originRoutes || 0;
        const destCount = row._count?.destinationRoutes || 0;
        return originCount + destCount;
      },
    },
    {
      id: "status",
      header: "Estado",
      accessorKey: "active",
      sortable: true,
      cell: ({ row }) => (
        <Badge variant={row.active ? "default" : "destructive"}>
          {row.active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      {isLoadingLocations ? (
        <LoadingTable columnCount={3} rowCount={5} />
      ) : (
        <DataTable
          title="Lista de Ubicaciones"
          description="Ver y gestionar todas las ubicaciones del sistema"
          data={locations}
          columns={columns}
          searchable={true}
          searchField="name"
          defaultSort={{ field: "name", direction: "asc" }}
          onAdd={() => setShowCreateDialog(true)}
          onEdit={(location) => setLocationToEdit(location)}
          onDelete={(location) => setLocationToDelete(location.id)}
          onRowClick={handleViewLocation}
        />
      )}

      <CreateLocationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EditLocationDialog
        open={!!locationToEdit}
        onOpenChange={(open) => !open && setLocationToEdit(null)}
        location={locationToEdit}
      />

      <DeleteLocationDialog
        locationId={locationToDelete}
        onClose={() => setLocationToDelete(null)}
      />
    </div>
  );
} 