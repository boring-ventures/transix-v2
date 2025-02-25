"use client";

import { useState, useEffect } from "react";
import { useLocations } from "@/hooks/use-locations";
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

interface DeleteLocationDialogProps {
  locationId: string | null;
  onClose: () => void;
}

export function DeleteLocationDialog({
  locationId,
  onClose,
}: DeleteLocationDialogProps) {
  const { deleteLocation, isDeleting, fetchLocation } = useLocations();
  const [locationName, setLocationName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (locationId) {
      const getLocationDetails = async () => {
        try {
          const location = await fetchLocation(locationId);
          setLocationName(location.name);
        } catch (err) {
          console.error("Error al obtener detalles de la ubicación:", err);
        }
      };
      getLocationDetails();
    }
  }, [locationId, fetchLocation]);

  const handleDelete = async () => {
    if (!locationId) return;
    
    setError(null);
    try {
      await deleteLocation.mutateAsync(locationId);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar la ubicación"
      );
    }
  };

  return (
    <AlertDialog open={!!locationId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto eliminará la ubicación <strong>{locationName}</strong> del sistema.
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