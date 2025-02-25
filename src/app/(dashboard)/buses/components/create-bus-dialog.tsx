"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBuses, type BusFormData } from "@/hooks/use-buses";
import { type Company, useCompanies } from "@/hooks/use-companies";
import { useBusTemplates, type BusTemplate } from "@/hooks/use-bus-templates";
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
  plateNumber: z.string().min(2, "La placa debe tener al menos 2 caracteres"),
  companyId: z.string().min(1, "Debe seleccionar una empresa"),
  templateId: z.string().min(1, "Debe seleccionar una plantilla"),
  maintenanceStatus: z.string().default("active"),
  isActive: z.boolean().default(true),
});

type CreateBusFormValues = z.infer<typeof formSchema>;

interface CreateBusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBusDialog({
  open,
  onOpenChange,
}: CreateBusDialogProps) {
  const { createBus, isCreating } = useBuses();
  const { companies } = useCompanies();
  const { templates } = useBusTemplates();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateBusFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plateNumber: "",
      companyId: "",
      templateId: "",
      maintenanceStatus: "active",
      isActive: true,
    },
  });

  // Filter templates by company
  const filteredTemplates = templates.filter(
    (template: BusTemplate) => !selectedCompanyId || template.companyId === selectedCompanyId
  );

  // Handle company change
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    form.setValue("companyId", value);
    form.setValue("templateId", ""); // Reset template when company changes
  };

  const onSubmit = async (data: CreateBusFormValues) => {
    setError(null);
    
    try {
      await createBus.mutateAsync(data as BusFormData);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating bus:", err);
      setError(err instanceof Error ? err.message : "Error creating bus");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Bus</DialogTitle>
          <DialogDescription>
            Ingrese los detalles para crear un nuevo bus en el sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-123" {...field} />
                    </FormControl>
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company: Company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plantilla</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!selectedCompanyId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plantilla" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredTemplates.map((template: BusTemplate) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} ({template.totalCapacity} asientos)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!selectedCompanyId && (
                      <p className="text-sm text-muted-foreground">
                        Seleccione una empresa primero
                      </p>
                    )}
                    {selectedCompanyId && filteredTemplates.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No hay plantillas disponibles para esta empresa
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenanceStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado de Mantenimiento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Operativo</SelectItem>
                        <SelectItem value="in_maintenance">En Mantenimiento</SelectItem>
                        <SelectItem value="retired">Retirado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
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
                        Marque esta opción si el bus está activo en el sistema
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
                {error}
              </div>
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
                Crear Bus
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 