"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDrivers, type Driver } from "@/hooks/use-drivers";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  companyId: z.string().min(1, "Debe seleccionar una empresa"),
});

type AssignCompanyFormValues = z.infer<typeof formSchema>;

interface AssignCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
}

export function AssignCompanyDialog({
  open,
  onOpenChange,
  driver,
}: AssignCompanyDialogProps) {
  const { assignCompany, isAssigningCompany } = useDrivers();
  const { companies, isLoadingCompanies } = useCompanies();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AssignCompanyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: driver?.companyId || "",
    },
  });

  const onSubmit = async (data: AssignCompanyFormValues) => {
    if (!driver) return;
    
    setError(null);
    try {
      await assignCompany.mutateAsync({
        id: driver.id,
        companyId: data.companyId,
      });
      onOpenChange(false);
    } catch {
      setError("Error al asignar empresa. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Empresa</DialogTitle>
          <DialogDescription>
            Asignar una empresa al conductor {driver?.fullName}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isAssigningCompany}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isAssigningCompany}>
                {isAssigningCompany && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Asignar Empresa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 