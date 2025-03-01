"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRoutes, type Route } from "@/hooks/use-routes";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/table/data-table";
import { LoadingTable } from "@/components/table/loading-table";
import { CreateRouteDialog } from "../components/create-route-dialog";
import { DeleteRouteDialog } from "../components/delete-route-dialog";
import type { Column } from "@/components/table/types";
import { EditRouteDialog } from "../components/edit-route-dialog";

export default function RoutesClient() {
  const router = useRouter();
  const { routes, isLoading } = useRoutes();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const handleViewRoute = (route: Route) => {
    router.push(`/routes/list/${route.id}`);
  };

  const columns: Column<Route>[] = [
    {
      id: "name",
      header: "Nombre",
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "origin",
      header: "Origen",
      accessorKey: "origin",
      cell: ({ row }) => row.origin?.name || "-",
      sortable: true,
    },
    {
      id: "destination",
      header: "Destino",
      accessorKey: "destination",
      cell: ({ row }) => row.destination?.name || "-",
      sortable: true,
    },
    {
      id: "duration",
      header: "Duración (min)",
      accessorKey: "estimatedDuration",
      sortable: true,
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
      {isLoading ? (
        <LoadingTable columnCount={5} rowCount={5} />
      ) : (
        <DataTable
          title="Lista de Rutas"
          description="Ver y gestionar todas las rutas del sistema"
          data={routes}
          columns={columns}
          searchable={true}
          searchField="name"
          defaultSort={{ field: "name", direction: "asc" }}
          onAdd={() => setShowCreateDialog(true)}
          onEdit={(route) => setRouteToEdit(route)}
          onDelete={(route) => setRouteToDelete(route.id)}
          onRowClick={handleViewRoute}
        />
      )}

      <CreateRouteDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EditRouteDialog
        open={!!routeToEdit}
        onOpenChange={(open: boolean) => !open && setRouteToEdit(null)}
        route={routeToEdit}
      />

      <DeleteRouteDialog
        routeId={routeToDelete}
        onClose={() => setRouteToDelete(null)}
      />
    </div>
  );
} 