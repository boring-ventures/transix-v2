"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSeatTiers, type SeatTier, type SeatTierFormData } from "@/hooks/use-seat-tiers";
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
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
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
        await updateSeatTier({
          id: editingTier.id,
          ...data,
          companyId,
        });
        toast({
          title: "Tipo de asiento actualizado",
          description: "El tipo de asiento ha sido actualizado exitosamente",
        });
      } else {
        await createSeatTier({
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
      await deleteSeatTier(id);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestionar Tipos de Asiento</DialogTitle>
          <DialogDescription>
            Cree y gestione los tipos de asiento para esta empresa
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">
              {editingTier ? "Editar Tipo de Asiento" : "Nuevo Tipo de Asiento"}
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
                        <Input {...field} />
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
                        <Input {...field} />
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
                      <FormLabel>Precio Base</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {error && (
                  <p className="text-sm font-medium text-destructive">{error}</p>
                )}
                
                <div className="flex justify-between">
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
                    className="ml-auto"
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
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {seatTiers.map((tier) => (
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
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(tier.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting && tier.id === editingTier?.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Eliminar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay tipos de asiento definidos
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 