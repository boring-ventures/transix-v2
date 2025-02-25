"use client";

import { useState, useEffect } from "react";
import { useDrivers } from "@/hooks/use-drivers";
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

interface DeleteDriverDialogProps {
  driverId: string | null;
  onClose: () => void;
}

export function DeleteDriverDialog({
  driverId,
  onClose,
}: DeleteDriverDialogProps) {
  const { deleteDriver, isDeleting, fetchDriver } = useDrivers();
  const [driverName, setDriverName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (driverId) {
      const getDriverDetails = async () => {
        try {
          const driver = await fetchDriver(driverId);
          setDriverName(driver.fullName);
        } catch (err) {
          console.error("Error al obtener detalles del conductor:", err);
        }
      };
      getDriverDetails();
    }
  }, [driverId, fetchDriver]);

  const handleDelete = async () => {
    if (!driverId) return;
    
    setError(null);
    try {
      await deleteDriver.mutateAsync(driverId);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar el conductor"
      );
    }
  };

  return (
    <AlertDialog open={!!driverId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto desactivará el conductor <strong>{driverName}</strong> del sistema.
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