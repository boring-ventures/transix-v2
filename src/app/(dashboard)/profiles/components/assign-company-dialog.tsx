"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfiles, type Profile } from "@/hooks/use-profiles";
import { type Branch, useCompanies, type Company } from "@/hooks/use-companies";
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
  branchId: z.string().optional(),
  role: z.enum(["company_admin", "branch_admin", "seller"]),
});

type AssignCompanyFormValues = z.infer<typeof formSchema>;

interface AssignCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
}

export function AssignCompanyDialog({
  open,
  onOpenChange,
  profile,
}: AssignCompanyDialogProps) {
  const { assignCompany, isAssigningCompany } = useProfiles();
  const { companies, isLoadingCompanies } = useCompanies();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AssignCompanyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "",
      branchId: "",
      role: "seller",
    },
  });

  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      form.reset({
        companyId: profile.companyId || "",
        branchId: profile.branchId || "",
        role: profile.role === "superadmin" ? "company_admin" : profile.role,
      });

      if (profile.companyId) {
        const company = companies.find((c: Company) => c.id === profile.companyId);
        if (company) {
          setSelectedCompany(company);
        }
      }
    }
  }, [profile, form, companies]);

  // Update branches when company changes
  useEffect(() => {
    if (selectedCompany?.branches) {
      setBranches(selectedCompany.branches);
    } else {
      setBranches([]);
    }
  }, [selectedCompany]);

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c: Company) => c.id === companyId);
    setSelectedCompany(company || null);
    form.setValue("branchId", "");
  };

  const onSubmit = async (data: AssignCompanyFormValues) => {
    if (!profile) return;

    setError(null);
    try {
      await assignCompany.mutateAsync({
        id: profile.userId,
        companyId: data.companyId,
        branchId: data.branchId || undefined,
        role: data.role,
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
            Asignar una empresa al usuario {profile?.fullName}.
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleCompanyChange(value);
                    }}
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
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCompany || branches.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sucursal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No hay sucursales disponibles
                        </SelectItem>
                      ) : (
                        branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="company_admin">
                        Admin de Empresa
                      </SelectItem>
                      <SelectItem value="branch_admin">
                        Admin de Sucursal
                      </SelectItem>
                      <SelectItem value="seller">Vendedor</SelectItem>
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
