"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSeatTiers, type SeatTier } from "@/hooks/use-seat-tiers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, Trash2, Edit } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(0, "El precio base debe ser mayor o igual a 0"),
});

type SeatTierFormValues = z.infer<typeof formSchema>;

interface ManageSeatTiersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function ManageSeatTiersDialog({
  open,
  onOpenChange,
  companyId,
}: ManageSeatTiersDialogProps) {
  const { seatTiers, createSeatTier, updateSeatTier, deleteSeatTier, isCreating, isUpdating, isDeleting } = useSeatTiers(companyId);
  const [editingTier, setEditingTier] = useState<SeatTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SeatTierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: 0,
    },
  });

  // Reset form when editing tier changes
  useEffect(() => {
    if (editingTier) {
      form.reset({
        name: editingTier.name,
        description: editingTier.description || "",
        basePrice: editingTier.basePrice,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        basePrice: 0,
      });
    }
  }, [editingTier, form]);

  const onSubmit = async (data: SeatTierFormValues) => {
    if (!companyId) {
      setError("Debe seleccionar una empresa primero");
      return;
    }
    
    setError(null);
    
    try {
      if (editingTier) {
        await updateSeatTier.mutateAsync({
          id: editingTier.id,
          data: {
            ...data,
            companyId,
          },
        });
        toast({
          title: "Tipo de asiento actualizado",
          description: "El tipo de asiento ha sido actualizado exitosamente",
        });
      } else {
        await createSeatTier.mutateAsync({
          ...data,
          companyId,
        });
        toast({
          title: "Tipo de asiento creado",
          description: "El tipo de asiento ha sido creado exitosamente",
        });
      }
      
      form.reset();
      setEditingTier(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al guardar el tipo de asiento"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSeatTier.mutateAsync(id);
      toast({
        title: "Tipo de asiento eliminado",
        description: "El tipo de asiento ha sido eliminado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el tipo de asiento",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Tipos de Asiento</DialogTitle>
          <DialogDescription>
            Cree y administre los tipos de asiento para su empresa
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div>
            <h3 className="text-lg font-medium mb-4">
              {editingTier ? "Editar Tipo de Asiento" : "Crear Nuevo Tipo de Asiento"}
            </h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: VIP, Económico, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Descripción del tipo de asiento" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Base ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {error && (
                  <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
                    {error}
                  </div>
                )}
                
                <div className="flex justify-between pt-2">
                  {editingTier && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingTier(null)}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    className={editingTier ? "" : "ml-auto"}
                    disabled={isCreating || isUpdating}
                  >
                    {(isCreating || isUpdating) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingTier ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Tipos de Asiento Existentes</h3>
            
            {seatTiers && seatTiers.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {seatTiers.map((tier: SeatTier) => (
                  <Card key={tier.id} className="relative">
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{tier.name}</CardTitle>
                        <Badge variant={tier.isActive ? "outline" : "secondary"}>
                          {tier.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      {tier.description && (
                        <CardDescription>{tier.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm">Precio Base: ${tier.basePrice}</p>
                    </CardContent>
                    <CardFooter className="py-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTier(tier)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(tier.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No hay tipos de asiento definidos
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 