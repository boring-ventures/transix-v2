"use client";

import { useState, useEffect } from "react";
import { useProfiles } from "@/hooks/use-profiles";
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

interface DeleteProfileDialogProps {
  profileId: string | null;
  onClose: () => void;
}

export function DeleteProfileDialog({
  profileId,
  onClose,
}: DeleteProfileDialogProps) {
  const { deleteProfile, isDeleting, fetchProfile } = useProfiles();
  const [profileName, setProfileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileId) {
      const getProfileDetails = async () => {
        try {
          const profile = await fetchProfile(profileId);
          setProfileName(profile.fullName);
        } catch (err) {
          console.error("Error al obtener detalles del usuario:", err);
        }
      };
      getProfileDetails();
    }
  }, [profileId, fetchProfile]);

  const handleDelete = async () => {
    if (!profileId) return;
    
    setError(null);
    try {
      await deleteProfile.mutateAsync(profileId);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar el usuario"
      );
    }
  };

  return (
    <AlertDialog open={!!profileId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto eliminará el usuario <strong>{profileName}</strong> del sistema.
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