"use client";

import { useState, useEffect } from "react";
import { useBusTemplates } from "@/hooks/use-bus-templates";
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

interface DeleteBusTemplateDialogProps {
  templateId: string | null;
  onClose: () => void;
}

export function DeleteBusTemplateDialog({
  templateId,
  onClose,
}: DeleteBusTemplateDialogProps) {
  const { deleteTemplate: deleteTemplateMutation, isDeleting, fetchTemplate } = useBusTemplates();
  const [templateName, setTemplateName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (templateId) {
      const getTemplateDetails = async () => {
        try {
          const template = await fetchTemplate(templateId);
          setTemplateName(template.name);
        } catch (err) {
          console.error("Error al obtener detalles de la plantilla:", err);
        }
      };
      getTemplateDetails();
    }
  }, [templateId, fetchTemplate]);

  const handleDelete = async () => {
    if (!templateId) return;
    
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al eliminar la plantilla"
      );
    }
  };

  return (
    <AlertDialog open={!!templateId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto eliminará la plantilla <strong>{templateName}</strong> del sistema.
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