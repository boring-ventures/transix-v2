"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoutes, type RouteFormData } from "@/hooks/use-routes";
import { useLocations } from "@/hooks/use-locations";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  originId: z.string().min(1, "Debe seleccionar un origen"),
  destinationId: z.string().min(1, "Debe seleccionar un destino"),
  estimatedDuration: z.coerce.number().min(1, "La duración debe ser mayor a 0"),
  departureLane: z.string().optional(),
  active: z.boolean().default(true),
}).refine(data => data.originId !== data.destinationId, {
  message: "El origen y destino no pueden ser iguales",
  path: ["destinationId"],
});

type CreateRouteFormValues = z.infer<typeof formSchema>;

interface CreateRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRouteDialog({
  open,
  onOpenChange,
}: CreateRouteDialogProps) {
  const { createRoute, isCreating } = useRoutes();
  const { locations, isLoadingLocations } = useLocations();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateRouteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      originId: "",
      destinationId: "",
      estimatedDuration: 0,
      departureLane: "",
      active: true,
    },
  });

  const onSubmit = async (data: CreateRouteFormValues) => {
    setError(null);
    
    try {
      await createRoute.mutateAsync(data as RouteFormData);
      form.reset();
      onOpenChange(false);
    } catch {
      setError("Error al crear la ruta. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Ruta</DialogTitle>
          <DialogDescription>
            Agregue una nueva ruta al sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la ruta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoadingLocations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar origen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
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
                name="destinationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoadingLocations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración Estimada (minutos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="Duración en minutos" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departureLane"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carril de Salida</FormLabel>
                    <FormControl>
                      <Input placeholder="Carril de salida (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      La ruta estará disponible en el sistema
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
                Crear Ruta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 