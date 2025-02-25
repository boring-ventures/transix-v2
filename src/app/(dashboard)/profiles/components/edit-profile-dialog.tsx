"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfiles, type Profile, type ProfileFormData } from "@/hooks/use-profiles";
import { useCompanies, type Company, type Branch } from "@/hooks/use-companies";
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
  email: z.string().email("Email inválido").optional(),
  role: z.enum(["superadmin", "company_admin", "branch_admin", "seller"]),
  active: z.boolean().default(true),
  companyId: z.string().optional(),
  branchId: z.string().optional(),
});

type EditProfileFormValues = z.infer<typeof formSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
}: EditProfileDialogProps) {
  const { updateProfile, isUpdating, assignCompany, isAssigningCompany } = useProfiles();
  const { companies, isLoadingCompanies } = useCompanies(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "seller",
      active: true,
      companyId: "",
      branchId: "",
    },
  });

  // Watch for role changes to conditionally show company fields
  const role = form.watch("role");
  const isSuperAdmin = role === "superadmin";

  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName,
        email: profile.email || "",
        role: profile.role,
        active: profile.active,
        companyId: profile.companyId || "",
        branchId: profile.branchId || "",
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
  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c: Company) => c.id === companyId);
    setSelectedCompany(company || null);
    form.setValue("branchId", "");
  };

  // Update branches when company changes
  useEffect(() => {
    if (selectedCompany?.branches) {
      setBranches(selectedCompany.branches);
    } else {
      setBranches([]);
    }
  }, [selectedCompany]);

  const onSubmit = async (data: EditProfileFormValues) => {
    if (!profile) return;
    
    setError(null);
    try {
      // If changing to superadmin, ensure company and branch are null
      if (data.role === "superadmin") {
        data.companyId = undefined;
        data.branchId = undefined;
      }
      
      // First update the profile basic info
      await updateProfile.mutateAsync({
        id: profile.userId,
        data: {
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          active: data.active,
          // If user is now a superadmin, explicitly set company and branch to null
          companyId: data.role === "superadmin" ? null : data.companyId,
          branchId: data.role === "superadmin" ? null : data.branchId,
        } as ProfileFormData,
      });
      
      // Only handle company assignment for non-superadmin roles
      if (data.role !== "superadmin" && 
          (data.companyId !== profile.companyId || data.branchId !== profile.branchId)) {
        await assignCompany.mutateAsync({
          id: profile.userId,
          companyId: data.companyId || "",
          branchId: data.branchId || "",
          role: data.role,
        });
      }
      
      onOpenChange(false);
    } catch {
      setError("Error al actualizar el usuario. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Actualizar la información del usuario a continuación.
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="usuario@ejemplo.com"
                      type="email"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                      <SelectItem value="company_admin">Admin de Empresa</SelectItem>
                      <SelectItem value="branch_admin">Admin de Sucursal</SelectItem>
                      <SelectItem value="seller">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Only show company and branch fields for non-superadmin roles */}
            {!isSuperAdmin && (
              <>
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
              </>
            )}

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
                      El usuario estará disponible en el sistema
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