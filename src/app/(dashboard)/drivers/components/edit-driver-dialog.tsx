"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDrivers, type Driver, type DriverFormData } from "@/hooks/use-drivers";
import { useCompanies, type Company } from "@/hooks/use-companies";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  documentId: z.string().min(5, "El documento debe tener al menos 5 caracteres"),
  licenseNumber: z.string().min(5, "El número de licencia debe tener al menos 5 caracteres"),
  licenseCategory: z.string().min(1, "La categoría es requerida"),
  companyId: z.string().min(1, "Debe seleccionar una empresa"),
  active: z.boolean().default(true),
});

type EditDriverFormValues = z.infer<typeof formSchema>;

interface EditDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
}

export function EditDriverDialog({
  open,
  onOpenChange,
  driver,
}: EditDriverDialogProps) {
  const { updateDriver, isUpdating, assignCompany, isAssigningCompany } = useDrivers();
  const { companies, isLoadingCompanies } = useCompanies(false);
  const [error, setError] = useState<string | null>(null);
  const [companyChanged, setCompanyChanged] = useState(false);

  const form = useForm<EditDriverFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      documentId: "",
      licenseNumber: "",
      licenseCategory: "",
      companyId: "",
      active: true,
    },
  });

  // Update form values when driver changes
  useEffect(() => {
    if (driver) {
      form.reset({
        fullName: driver.fullName,
        documentId: driver.documentId,
        licenseNumber: driver.licenseNumber,
        licenseCategory: driver.licenseCategory,
        companyId: driver.companyId || "",
        active: driver.active,
      });
      setCompanyChanged(false);
    }
  }, [driver, form]);

  const onSubmit = async (data: EditDriverFormValues) => {
    if (!driver) return;
    
    setError(null);
    try {
      // Update driver data
      await updateDriver.mutateAsync({
        id: driver.id,
        data: {
          fullName: data.fullName,
          documentId: data.documentId,
          licenseNumber: data.licenseNumber,
          licenseCategory: data.licenseCategory,
          companyId: data.companyId,
          active: data.active,
        } as DriverFormData,
      });
      
      // If company changed, handle company assignment
      if (companyChanged) {
        await assignCompany.mutateAsync({
          id: driver.id,
          companyId: data.companyId,
        });
      }
      
      onOpenChange(false);
    } catch {
      setError("Error al actualizar el conductor. Por favor, inténtelo de nuevo.");
    }
  };

  const handleCompanyChange = (value: string) => {
    if (driver && value !== driver.companyId) {
      setCompanyChanged(true);
    }
    form.setValue("companyId", value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conductor</DialogTitle>
          <DialogDescription>
            Actualizar información del conductor {driver?.fullName}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del conductor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento de Identidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de documento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Licencia</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de licencia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría de Licencia</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="P">P</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select
                    onValueChange={handleCompanyChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCompanies ? (
                        <SelectItem value="loading" disabled>
                          Cargando empresas...
                        </SelectItem>
                      ) : (
                        companies.map((company: Company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Activo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      El conductor estará disponible en el sistema
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUpdating || isAssigningCompany}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating || isAssigningCompany}>
                {(isUpdating || isAssigningCompany) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 