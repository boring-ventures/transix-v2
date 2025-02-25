"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfiles, type Profile, type ProfileFormData } from "@/hooks/use-profiles";
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
  const { updateProfile, isUpdating } = useProfiles();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "seller",
      active: true,
    },
  });

  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName,
        email: profile.email || "",
        role: profile.role,
        active: profile.active,
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: EditProfileFormValues) => {
    if (!profile) return;
    
    setError(null);
    try {
      await updateProfile.mutateAsync({
        id: profile.userId,
        data: data as ProfileFormData,
      });
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
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && (
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