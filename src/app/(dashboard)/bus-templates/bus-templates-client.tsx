"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBusTemplates, type BusTemplate } from "@/hooks/use-bus-templates";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DataTable } from "@/components/table/data-table";
import { LoadingTable } from "@/components/table/loading-table";
import { CreateBusTemplateDialog } from "./components/create-bus-template-dialog";
import { DeleteBusTemplateDialog } from "./components/delete-bus-template-dialog";
import type { Column } from "@/components/table/types";
import { CompanyFilterDisplay } from "@/components/company/company-filter-display";

export default function BusTemplatesClient() {
  const router = useRouter();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const { templates, isLoadingTemplates, isCompanyRestricted } =
    useBusTemplates(undefined, selectedCompanyId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleViewTemplate = (template: BusTemplate) => {
    router.push(`/bus-templates/${template.id}`);
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  const columns: Column<BusTemplate>[] = [
    {
      id: "name",
      header: "Nombre",
      accessorKey: "name",
      sortable: true,
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
          } as Column<BusTemplate>,
        ]),
    {
      id: "type",
      header: "Tipo",
      accessorKey: "type",
      sortable: true,
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.type}
        </Badge>
      ),
    },
    {
      id: "totalCapacity",
      header: "Capacidad",
      accessorKey: "totalCapacity",
      sortable: true,
    },
    {
      id: "status",
      header: "Estado",
      accessorKey: "isActive",
      sortable: true,
      cell: ({ row }) => (
        <Badge variant={row.isActive ? "default" : "destructive"}>
          {row.isActive ? "Activo" : "Inactivo"}
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
  ];

  return (
    <div className="container mx-auto py-6">
      {!isCompanyRestricted && (
        <CompanyFilterDisplay onCompanyChange={handleCompanyChange} />
      )}

      {isLoadingTemplates ? (
        <LoadingTable columnCount={isCompanyRestricted ? 5 : 6} rowCount={5} />
      ) : (
        <DataTable
          title="Plantillas de Bus"
          description="Ver y gestionar todas las plantillas de buses para la flota"
          data={templates}
          columns={columns}
          searchable={true}
          searchField="name"
          defaultSort={{ field: "name", direction: "asc" }}
          onAdd={() => setShowCreateDialog(true)}
          onDelete={(template) => setTemplateToDelete(template.id)}
          onRowClick={handleViewTemplate}
        />
      )}

      <CreateBusTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <DeleteBusTemplateDialog
        templateId={templateToDelete}
        onClose={() => setTemplateToDelete(null)}
      />
    </div>
  );
}
