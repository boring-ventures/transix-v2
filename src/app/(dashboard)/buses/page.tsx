"use client";

import { useState, useEffect } from "react";
import { useBuses } from "@/hooks/use-buses";
import { BusesTable } from "./components/buses-table";
import { CreateBusDialog } from "./components/create-bus-dialog";
import { LoadingTable } from "@/components/table/loading-table";

export default function BusesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { buses, isLoadingBuses, busesError } = useBuses();

  // Add debugging
  useEffect(() => {
    console.log("Buses data:", buses);
    if (busesError) {
      console.error("Error loading buses:", busesError);
    }
  }, [buses, busesError]);

  return (
    <div className="space-y-6">
      {isLoadingBuses ? (
        <LoadingTable columnCount={5} rowCount={5} />
      ) : (
        <>
          {buses.length === 0 && !isLoadingBuses && (
            <div className="p-4 bg-muted rounded-md mb-4">
              <p>
                No buses found. Create your first bus using the &quot;Add&quot; button.
              </p>
            </div>
          )}
          <BusesTable
            data={buses}
            title="Buses"
            description="Gestiona los buses de tu flota"
            onAdd={() => setShowCreateDialog(true)}
          />
        </>
      )}

      <CreateBusDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
} 