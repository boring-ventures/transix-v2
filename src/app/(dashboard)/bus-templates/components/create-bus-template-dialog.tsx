"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  type SeatPosition,
  useBusTemplates,
  type BusTemplateFormData,
  type SeatTemplateMatrix,
} from "@/hooks/use-bus-templates";
import { type Company, useCompanies } from "@/hooks/use-companies";
import { type SeatTier, useSeatTiers } from "@/hooks/use-seat-tiers";
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
import { SeatMatrixEditor } from "./seat-matrix-editor";
import { ManageSeatTiersDialog } from "./manage-seat-tiers-dialog";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  companyId: z.string().min(1, "Debe seleccionar una empresa"),
  totalCapacity: z.number().min(1, "La capacidad debe ser mayor a 0"),
  type: z.string().min(1, "Debe seleccionar un tipo"),
  seatTemplateMatrix: z.any(),
  seatsLayout: z.any(),
  isActive: z.boolean().default(true),
});

type CreateBusTemplateFormValues = z.infer<typeof formSchema>;

interface CreateBusTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBusTemplateDialog({
  open,
  onOpenChange,
}: CreateBusTemplateDialogProps) {
  const { createTemplate, isCreating } = useBusTemplates();
  const { companies } = useCompanies();
  const { seatTiers, isLoadingSeatTiers } = useSeatTiers();
  const [showSeatTiersDialog, setShowSeatTiersDialog] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateBusTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      companyId: "",
      totalCapacity: 0,
      type: "standard",
      seatTemplateMatrix: {
        firstFloor: {
          dimensions: { rows: 4, seatsPerRow: 4 },
          seats: [],
        },
      },
      seatsLayout: "single_floor",
      isActive: true,
    },
  });

  // Initialize seat matrix when form is opened
  useEffect(() => {
    if (open) {
      const initialMatrix = {
        firstFloor: {
          dimensions: { rows: 4, seatsPerRow: 4 },
          seats: generateInitialSeats(4, 4),
        },
      };

      form.setValue("seatTemplateMatrix", initialMatrix);
      form.setValue("totalCapacity", 16); // 4x4
    }
  }, [open, form]);

  // Generate initial seats for the matrix
  const generateInitialSeats = (rows: number, seatsPerRow: number) => {
    const seats = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < seatsPerRow; col++) {
        const seatId = `${row + 1}${String.fromCharCode(65 + col)}`;
        seats.push({
          id: seatId,
          name: seatId,
          row,
          column: col,
          tierId: "",
          isEmpty: false,
          status: "available",
        });
      }
    }
    return seats;
  };

  // Watch for company changes to filter seat tiers
  const watchCompanyId = form.watch("companyId");
  useEffect(() => {
    if (watchCompanyId) {
      setSelectedCompanyId(watchCompanyId);
    }
  }, [watchCompanyId]);

  const handleMatrixChange = (newMatrix: SeatTemplateMatrix) => {
    form.setValue("seatTemplateMatrix", newMatrix);

    // Calculate total capacity
    let totalCapacity = 0;
    if (newMatrix.firstFloor) {
      totalCapacity += newMatrix.firstFloor.seats.filter(
        (s: SeatPosition) => !s.isEmpty
      ).length;
    }
    if (newMatrix.secondFloor) {
      totalCapacity += newMatrix.secondFloor.seats.filter(
        (s: SeatPosition) => !s.isEmpty
      ).length;
    }

    form.setValue("totalCapacity", totalCapacity);
  };

  const onSubmit = async (data: CreateBusTemplateFormValues) => {
    try {
      setError(null);

      // Validate that all non-empty seats have a tier assigned
      const matrix = data.seatTemplateMatrix;
      const unassignedSeats = [];

      if (matrix.firstFloor) {
        unassignedSeats.push(
          ...matrix.firstFloor.seats.filter(
            (s: SeatPosition) => !s.isEmpty && !s.tierId
          )
        );
      }

      if (matrix.secondFloor) {
        unassignedSeats.push(
          ...matrix.secondFloor.seats.filter(
            (s: SeatPosition) => !s.isEmpty && !s.tierId
          )
        );
      }

      if (unassignedSeats.length > 0) {
        setError(
          "Todos los asientos deben tener un tipo asignado o marcarse como espacio vacío"
        );
        return;
      }

      await createTemplate.mutateAsync(data as BusTemplateFormData);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating bus template:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear la plantilla"
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Plantilla de Bus</DialogTitle>
            <DialogDescription>
              Cree una nueva plantilla para configurar los buses de su flota
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
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
                            {companies?.map((company: Company) => (
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Bus</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Estándar</SelectItem>
                            <SelectItem value="luxury">Lujo</SelectItem>
                            <SelectItem value="double_decker">
                              Dos Pisos
                            </SelectItem>
                            <SelectItem value="minibus">Minibús</SelectItem>
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
                            La plantilla estará disponible para asignar a buses
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between items-center pt-4">
                    <h3 className="text-sm font-medium">Tipos de Asiento</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSeatTiersDialog(true)}
                      disabled={!selectedCompanyId}
                    >
                      Gestionar Tipos de Asiento
                    </Button>
                  </div>

                  {!selectedCompanyId && (
                    <p className="text-sm text-muted-foreground">
                      Seleccione una empresa para gestionar los tipos de asiento
                    </p>
                  )}

                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {isLoadingSeatTiers ? (
                      <p className="text-sm text-muted-foreground">
                        Cargando tipos de asiento...
                      </p>
                    ) : seatTiers?.filter(
                        (tier: SeatTier) => tier.companyId === selectedCompanyId
                      ).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay tipos de asiento definidos
                      </p>
                    ) : (
                      seatTiers
                        ?.filter(
                          (tier: SeatTier) =>
                            tier.companyId === selectedCompanyId
                        )
                        .map((tier: SeatTier) => (
                          <div
                            key={tier.id}
                            className="flex justify-between items-center p-2 border rounded-md"
                          >
                            <div>
                              <p className="font-medium">{tier.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Precio Base: ${tier.basePrice}
                              </p>
                            </div>
                            <Badge
                              variant={tier.isActive ? "outline" : "secondary"}
                            >
                              {tier.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="seatTemplateMatrix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Configuración de Asientos</FormLabel>
                        <FormControl>
                          <div className="border rounded-md p-4">
                            <SeatMatrixEditor
                              value={field.value}
                              onChange={handleMatrixChange}
                              seatTiers={
                                seatTiers?.filter(
                                  (tier: SeatTier) =>
                                    tier.companyId === selectedCompanyId
                                ) || []
                              }
                              companyId={selectedCompanyId}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalCapacity"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Capacidad Total</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value) || 0
                              )
                            }
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                  Crear Plantilla
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ManageSeatTiersDialog
        open={showSeatTiersDialog}
        onOpenChange={setShowSeatTiersDialog}
        companyId={selectedCompanyId}
      />
    </>
  );
}
