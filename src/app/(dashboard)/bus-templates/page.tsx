"use client";

import { useState } from "react";
import { useBusTemplates } from "@/hooks/use-bus-templates";

import { BusTemplatesTable } from "./components/bus-templates-table";
import { CreateBusTemplateDialog } from "./components/create-bus-template-dialog";
import { LoadingTable } from "@/components/table/loading-table";

export default function BusTemplatesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { templates, isLoadingTemplates } = useBusTemplates();

  return (
    <div className="space-y-6">

      {isLoadingTemplates ? (
        <LoadingTable columnCount={5} rowCount={5} />
      ) : (
        <BusTemplatesTable
          data={templates}
          title="Plantillas de Bus"
          description="Gestiona las plantillas de bus para tus vehículos"
          onAdd={() => setShowCreateDialog(true)}
        />
      )}

      <CreateBusTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
