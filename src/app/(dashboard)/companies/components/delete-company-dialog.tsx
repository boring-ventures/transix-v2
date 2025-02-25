"use client";

import { useState, useEffect } from "react";
import { useCompanies } from "@/hooks/use-companies";
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

interface DeleteCompanyDialogProps {
  companyId: string | null;
  onClose: () => void;
}

export function DeleteCompanyDialog({
  companyId,
  onClose,
}: DeleteCompanyDialogProps) {
  const { deleteCompany, isDeleting, fetchCompany } = useCompanies();
  const [companyName, setCompanyName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      const getCompanyDetails = async () => {
        try {
          const company = await fetchCompany(companyId);
          setCompanyName(company.name);
        } catch (err) {
          console.error("Error al obtener detalles de la empresa:", err);
        }
      };
      getCompanyDetails();
    }
  }, [companyId, fetchCompany]);

  const handleDelete = async () => {
    if (!companyId) return;
    
    setError(null);
    try {
      await deleteCompany.mutateAsync(companyId);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al desactivar la empresa"
      );
    }
  };

  return (
    <AlertDialog open={!!companyId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto desactivará la empresa <strong>{companyName}</strong>. La
            empresa no aparecerá en las listas, pero sus datos se conservarán en
            el sistema.
            <br />
            <br />
            Nota: Las empresas con sucursales, perfiles, buses o conductores
            activos deben desactivar primero estos elementos.
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
                Desactivando...
              </>
            ) : (
              "Desactivar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 