"use client";

import { useState, useEffect } from "react";
import { useBuses } from "@/hooks/use-buses";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteBusDialogProps {
  busId: string | null;
  onClose: () => void;
}

export function DeleteBusDialog({
  busId,
  onClose,
}: DeleteBusDialogProps) {
  const { deleteBus, isDeleting, fetchBus } = useBuses();
  const [busPlateNumber, setBusPlateNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (busId) {
      const getBusDetails = async () => {
        try {
          const bus = await fetchBus(busId);
          setBusPlateNumber(bus.plateNumber);
        } catch (err) {
          console.error("Error al obtener detalles del bus:", err);
        }
      };
      getBusDetails();
    }
  }, [busId, fetchBus]);

  const handleDelete = async () => {
    if (!busId) return;
    
    setError(null);
    try {
      await deleteBus.mutateAsync(busId);
      onClose();
    } catch (err) {
      console.error("Error al eliminar el bus:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar el bus");
    }
  };

  return (
    <AlertDialog open={!!busId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto eliminará el bus <strong>{busPlateNumber}</strong> del sistema.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 