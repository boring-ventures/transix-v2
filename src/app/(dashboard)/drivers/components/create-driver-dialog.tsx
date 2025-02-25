"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDrivers, type DriverFormData } from "@/hooks/use-drivers";
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

type CreateDriverFormValues = z.infer<typeof formSchema>;

interface CreateDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDriverDialog({
  open,
  onOpenChange,
}: CreateDriverDialogProps) {
  const { createDriver, isCreating } = useDrivers();
  const { companies, isLoadingCompanies } = useCompanies(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateDriverFormValues>({
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

  const onSubmit = async (data: CreateDriverFormValues) => {
    setError(null);
    
    try {
      await createDriver.mutateAsync(data as DriverFormData);
      form.reset();
      onOpenChange(false);
    } catch {
      setError("Error al crear el conductor. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Conductor</DialogTitle>
          <DialogDescription>
            Añadir un nuevo conductor al sistema.
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
                    <Input
                      placeholder="Nombre completo"
                      {...field}
                    />
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
                    <Input
                      placeholder="Número de documento"
                      {...field}
                    />
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
                    <Input
                      placeholder="Número de licencia"
                      {...field}
                    />
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
                    onValueChange={field.onChange}
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
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Conductor
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 