"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfiles } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
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
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  role: z.enum(["superadmin", "company_admin", "branch_admin", "seller"]),
  active: z.boolean().default(true),
  companyId: z.string().optional(),
  branchId: z.string().optional(),
});

type CreateProfileFormValues = z.infer<typeof formSchema>;

interface CreateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProfileDialog({
  open,
  onOpenChange,
}: CreateProfileDialogProps) {
  const { signUp } = useAuth();
  const { createProfile, isCreating, userCompanyId, isCompanyRestricted } =
    useProfiles();
  const { companies, isLoadingCompanies } = useCompanies(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const form = useForm<CreateProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "seller",
      active: true,
      companyId: isCompanyRestricted ? userCompanyId || "" : "",
      branchId: "",
    },
  });

  const role = form.watch("role");
  const isSuperAdmin = role === "superadmin";

  useEffect(() => {
    if (isCompanyRestricted && userCompanyId) {
      form.setValue("companyId", userCompanyId);

      const company = companies.find((c: Company) => c.id === userCompanyId);
      setSelectedCompany(company || null);
    }
  }, [isCompanyRestricted, userCompanyId, form, companies]);

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c: Company) => c.id === companyId);
    setSelectedCompany(company || null);
    form.setValue("branchId", "");
  };

  useEffect(() => {
    if (selectedCompany?.branches) {
      setBranches(selectedCompany.branches);
    } else {
      setBranches([]);
    }
  }, [selectedCompany]);

  const onSubmit = async (data: CreateProfileFormValues) => {
    setError(null);

    if (isCompanyRestricted && data.role === "superadmin") {
      setError("No tiene permisos para crear un Super Admin");
      return;
    }

    if (data.role !== "superadmin" && !data.companyId) {
      setError("Debe seleccionar una empresa para este rol");
      return;
    }

    if (data.role === "branch_admin" && !data.branchId) {
      setError(
        "Debe seleccionar una sucursal para un administrador de sucursal"
      );
      return;
    }

    try {
      const {
        success,
        user,
        error: signUpError,
      } = await signUp(data.email, data.password);

      if (!success || !user) {
        setError(signUpError?.message || "Error al crear el usuario");
        return;
      }

      const profileData = {
        userId: user.id,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        active: data.active,
        companyId: data.role === "superadmin" ? null : data.companyId,
        branchId: data.role === "superadmin" ? null : data.branchId,
      };

      await createProfile.mutateAsync(profileData);

      form.reset();
      onOpenChange(false);
    } catch {
      setError("Error al crear el usuario. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Añadir un nuevo usuario al sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contraseña"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
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
                      {!isCompanyRestricted && (
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                      )}
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

            {!isSuperAdmin && (
              <>
                {!isCompanyRestricted ? (
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
                            {companies.map((company) => (
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
                ) : (
                  selectedCompany && (
                    <div className="flex flex-col space-y-1.5 mb-4">
                      <div className="text-sm font-medium">Empresa</div>
                      <div className="border rounded-md p-2 bg-muted/50">
                        {selectedCompany.name}
                      </div>
                    </div>
                  )
                )}

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
                            <SelectItem value="no_branches" disabled>
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
              <div className="bg-destructive/20 text-destructive text-sm p-2 rounded-md">
                {error}
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Usuario
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
