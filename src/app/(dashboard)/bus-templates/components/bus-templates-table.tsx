"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/table/data-table";
import { CompactSeatMatrix } from "./compact-seat-matrix";
import { DeleteBusTemplateDialog } from "./delete-bus-template-dialog";
import type { Column } from "@/components/table/types";
import type { SeatTemplateMatrix } from "@/hooks/use-bus-templates";

interface BusTemplate {
  id: string;
  name: string;
  description: string;
  companyId: string;
  company: {
    name: string;
  };
  totalCapacity: number;
  seatTemplateMatrix: SeatTemplateMatrix;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    buses: number;
  };
}

interface BusTemplatesTableProps {
  data: BusTemplate[];
  title: string;
  description: string;
  onAdd: () => void;
}

export function BusTemplatesTable({ 
  data, 
  title, 
  description, 
  onAdd 
}: BusTemplatesTableProps) {
  const router = useRouter();
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const columns: Column<BusTemplate>[] = [
    {
      id: "name",
      header: "Nombre",
      accessorKey: "name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.company.name}
          </div>
        </div>
      ),
    },
    {
      id: "type",
      header: "Tipo",
      accessorKey: "type",
      cell: ({ row }) => {
        const type = row.type;
        return (
          <div>
            {type === "standard" && "Estándar"}
            {type === "luxury" && "Lujo"}
            {type === "double_decker" && "Dos Pisos"}
            {type === "minibus" && "Minibús"}
          </div>
        );
      },
    },
    {
      id: "totalCapacity",
      header: "Capacidad",
      accessorKey: "totalCapacity",
      cell: ({ row }) => <div className="text-center">{row.totalCapacity}</div>,
    },
    {
      id: "seatMatrix",
      header: "Asientos",
      accessorKey: "seatTemplateMatrix",
      cell: ({ row }) => {
        const matrix = row.seatTemplateMatrix;
        return matrix ? (
          <div className="flex justify-center">
            <CompactSeatMatrix matrix={matrix} className="mx-auto" />
          </div>
        ) : null;
      },
    },
    {
      id: "isActive",
      header: "Estado",
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
        searchField="name"
        rowSelection={false}
        onRowClick={(row) => router.push(`/bus-templates/${row.id}`)}
        onAdd={onAdd}
        onDelete={(row) => setTemplateToDelete(row.id)}
        customActions={[
          {
            label: "Ver",
            onClick: (row) => router.push(`/bus-templates/${row.id}`),
          },
        ]}
      />

      <DeleteBusTemplateDialog
        templateId={templateToDelete}
        onClose={() => setTemplateToDelete(null)}
      />
    </>
  );
}
