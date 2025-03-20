"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDrivers, type Driver } from "@/hooks/use-drivers";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/table/data-table";
import { LoadingTable } from "@/components/table/loading-table";
import { CreateDriverDialog } from "./components/create-driver-dialog";
import { EditDriverDialog } from "./components/edit-driver-dialog";
import { DeleteDriverDialog } from "./components/delete-driver-dialog";
import type { Column } from "@/components/table/types";
import { CompanyFilterDisplay } from "@/components/company/company-filter-display";

export default function DriversClient() {
  const router = useRouter();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const { drivers, isLoadingDrivers, isCompanyRestricted } =
    useDrivers(selectedCompanyId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);

  const handleViewDriver = (driver: Driver) => {
    router.push(`/drivers/${driver.id}`);
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  const columns: Column<Driver>[] = [
    {
      id: "fullName",
      header: "Nombre",
      accessorKey: "fullName",
      sortable: true,
    },
    {
      id: "documentId",
      header: "Documento",
      accessorKey: "documentId",
      sortable: true,
    },
    {
      id: "licenseNumber",
      header: "Licencia",
      accessorKey: "licenseNumber",
      sortable: true,
    },
    {
      id: "licenseCategory",
      header: "Categoría",
      accessorKey: "licenseCategory",
      sortable: true,
      cell: ({ row }) => <Badge variant="outline">{row.licenseCategory}</Badge>,
    },
    // Only show company column for non-restricted users
    ...(isCompanyRestricted
      ? []
      : [
          {
            id: "company",
            header: "Empresa",
            accessorKey: "company",
            cell: ({ row }) => row.company?.name || "Sin empresa",
          } as Column<Driver>,
        ]),
    {
      id: "trips",
      header: "Viajes",
      accessorKey: "_count",
      cell: ({ row }) => {
        const primaryCount = row._count?.primarySchedules || 0;
        const secondaryCount = row._count?.secondarySchedules || 0;
        return primaryCount + secondaryCount;
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
      {!isCompanyRestricted && (
        <CompanyFilterDisplay onCompanyChange={handleCompanyChange} />
      )}

      {isLoadingDrivers ? (
        <LoadingTable columnCount={isCompanyRestricted ? 6 : 7} rowCount={5} />
      ) : (
        <DataTable
          title="Lista de Conductores"
          description="Ver y gestionar todos los conductores del sistema"
          data={drivers}
          columns={columns}
          searchable={true}
          searchField="fullName"
          defaultSort={{ field: "fullName", direction: "asc" }}
          onAdd={() => setShowCreateDialog(true)}
          onEdit={(driver) => setDriverToEdit(driver)}
          onDelete={(driver) => setDriverToDelete(driver.id)}
          onRowClick={handleViewDriver}
        />
      )}

      <CreateDriverDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EditDriverDialog
        open={!!driverToEdit}
        onOpenChange={(open) => !open && setDriverToEdit(null)}
        driver={driverToEdit}
      />

      <DeleteDriverDialog
        driverId={driverToDelete}
        onClose={() => setDriverToDelete(null)}
      />
    </div>
  );
}
