"use client";

import { useState, useEffect } from "react";
import { useRoutes } from "@/hooks/use-routes";
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

interface DeleteRouteDialogProps {
  routeId: string | null;
  onClose: () => void;
}

export function DeleteRouteDialog({
  routeId,
  onClose,
}: DeleteRouteDialogProps) {
  const { deleteRoute, isDeleting, fetchRoute } = useRoutes();
  const [routeName, setRouteName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (routeId) {
      const getRouteDetails = async () => {
        try {
          const route = await fetchRoute(routeId);
          setRouteName(route.name);
        } catch (err) {
          console.error("Error al obtener detalles de la ruta:", err);
        }
      };
      getRouteDetails();
    }
  }, [routeId, fetchRoute]);

  const handleDelete = async () => {
    if (!routeId) return;
    
    setError(null);
    try {
      await deleteRoute.mutateAsync(routeId);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar la ruta"
      );
    }
  };

  return (
    <AlertDialog open={!!routeId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto eliminará la ruta <strong>{routeName}</strong> del sistema.
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