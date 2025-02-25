"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCompanies, type Company } from "@/hooks/use-companies";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DataTable } from "@/components/table/data-table";
import { LoadingTable } from "@/components/table/loading-table";
import { CreateCompanyDialog } from "./components/create-company-dialog";
import { EditCompanyDialog } from "./components/edit-company-dialog";
import { DeleteCompanyDialog } from "./components/delete-company-dialog";
import type { Column } from "@/components/table/types";

export default function CompaniesClient() {
  const router = useRouter();
  const { companies, isLoadingCompanies } = useCompanies();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  const handleViewCompany = (company: Company) => {
    router.push(`/companies/${company.id}`);
  };

  const columns: Column<Company>[] = [
    {
      id: "name",
      header: "Nombre",
      accessorKey: "name",
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
    {
      id: "createdAt",
      header: "Creado",
      accessorKey: "createdAt",
      sortable: true,
      cell: ({ row }) => format(new Date(row.createdAt), "d MMM, yyyy"),
    },
    {
      id: "branches",
      header: "Sucursales",
      accessorKey: "_count",
      cell: ({ row }) => {
        return row.branches?.length || 0;
      },
    },
    {
      id: "users",
      header: "Usuarios",
      accessorKey: "_count",
      cell: ({ row }) => row._count?.profiles || 0,
    },
    {
      id: "buses",
      header: "Buses",
      accessorKey: "_count",
      cell: ({ row }) => row._count?.buses || 0,
    },
  ];

  return (
    <div className="container mx-auto py-6">
      {isLoadingCompanies ? (
        <LoadingTable columnCount={7} rowCount={5} />
      ) : (
        <DataTable
          title="Lista de Empresas"
          description="Ver y gestionar todas las empresas de transporte"
          data={companies}
          columns={columns}
          searchable={true}
          searchField="name"
          defaultSort={{ field: "name", direction: "asc" }}
          onAdd={() => setShowCreateDialog(true)}
          onEdit={(company) => setCompanyToEdit(company)}
          onDelete={(company) => setCompanyToDelete(company.id)}
          onRowClick={handleViewCompany}
        />
      )}

      <CreateCompanyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EditCompanyDialog
        open={!!companyToEdit}
        onOpenChange={(open) => !open && setCompanyToEdit(null)}
        company={companyToEdit}
      />

      <DeleteCompanyDialog
        companyId={companyToDelete}
        onClose={() => setCompanyToDelete(null)}
      />
    </div>
  );
}
