"use client";

import { useState } from "react";
import { useBuses } from "@/hooks/use-buses";
import { BusesTable } from "./components/buses-table";
import { CreateBusDialog } from "./components/create-bus-dialog";
import { LoadingTable } from "@/components/table/loading-table";

export default function BusesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { buses, isLoadingBuses } = useBuses();

  return (
    <div className="space-y-6">
      {isLoadingBuses ? (
        <LoadingTable columnCount={5} rowCount={5} />
      ) : (
        <BusesTable
          data={buses}
          title="Buses"
          description="Gestiona los buses de tu flota"
          onAdd={() => setShowCreateDialog(true)}
        />
      )}

      <CreateBusDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
} 