"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBuses, type Bus, type BusFormData } from "@/hooks/use-buses";
import { useBusSeats } from "@/hooks/use-bus-seats";
import { type Company, useCompanies } from "@/hooks/use-companies";
import { useBusTemplates, type BusTemplate } from "@/hooks/use-bus-templates";
import { useSeatTiers } from "@/hooks/use-seat-tiers";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import type { MaintenanceStatus, SeatTier } from "@prisma/client";
import type { BusSeat, MatrixSeat } from "@/hooks/use-bus-seats";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  plateNumber: z.string().min(2, "La placa debe tener al menos 2 caracteres"),
  companyId: z.string().min(1, "Debe seleccionar una empresa"),
  templateId: z.string().min(1, "Debe seleccionar una plantilla"),
  maintenanceStatus: z.string(),
  isActive: z.boolean(),
});

type EditBusFormValues = z.infer<typeof formSchema>;

interface EditBusFormProps {
  bus: Bus;
}

export function EditBusForm({ bus }: EditBusFormProps) {
  const router = useRouter();
  const {
    updateBus,
    isUpdating,
    updateMaintenanceStatus,
    isUpdatingMaintenance,
    updateBusSeats,
  } = useBuses();
  const { companies } = useCompanies();
  const { templates } = useBusTemplates();
  const { seats, isUpdatingSeats } = useBusSeats(bus.id);
  const { seatTiers } = useSeatTiers(bus.companyId);

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [seatType, setSeatType] = useState<string>("");
  const [seatStatus, setSeatStatus] = useState<string>("available");
  const [isSeatEmpty, setIsSeatEmpty] = useState<boolean>(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);

  const form = useForm<EditBusFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plateNumber: bus.plateNumber,
      companyId: bus.companyId,
      templateId: bus.templateId,
      maintenanceStatus: bus.maintenanceStatus,
      isActive: bus.isActive,
    },
  });

  useEffect(() => {
    if (bus) {
      form.reset({
        plateNumber: bus.plateNumber,
        companyId: bus.companyId,
        templateId: bus.templateId,
        maintenanceStatus: bus.maintenanceStatus,
        isActive: bus.isActive,
      });
    }
  }, [bus, form]);

  const handleCompanyChange = (value: string) => {
    form.setValue("companyId", value);
  };

  const onSubmit = async (data: EditBusFormValues) => {
    setError(null);

    try {
      await updateBus.mutateAsync({
        id: bus.id,
        data: data as Partial<BusFormData>,
      });

      toast({
        title: "Bus actualizado",
        description: "Los datos del bus han sido actualizados correctamente",
      });

      // Redirect to bus detail page
      router.push(`/buses/${bus.id}`);
    } catch (err) {
      console.error("Error updating bus:", err);
      setError(err instanceof Error ? err.message : "Error updating bus");
    }
  };

  const handleUpdateMaintenanceStatus = async (status: MaintenanceStatus) => {
    try {
      await updateMaintenanceStatus.mutateAsync({
        id: bus.id,
        status: status as MaintenanceStatus,
      });

      form.setValue("maintenanceStatus", status);

      toast({
        title: "Estado actualizado",
        description:
          "El estado de mantenimiento ha sido actualizado correctamente",
      });
    } catch (err) {
      console.error("Error updating maintenance status:", err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de mantenimiento",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSeats = async (updatedSeats: BusSeat[]) => {
    try {
      // Make sure updatedSeats is an array before sending
      if (!Array.isArray(updatedSeats)) {
        throw new Error("Updated seats must be an array");
      }

      await updateBusSeats.mutateAsync({
        busId: bus.id,
        seats: updatedSeats,
      });

      toast({
        title: "Asientos actualizados",
        description:
          "La configuración de asientos ha sido actualizada correctamente",
      });
    } catch (err) {
      console.error("Error updating seats:", err);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de asientos",
        variant: "destructive",
      });
    }
  };

  // Add this function to handle seat selection
  const handleSeatClick = (seatNumber: string) => {
    setSelectedSeat(seatNumber);

    // Find the seat in the current configuration
    const seatInMatrix =
      bus.seatMatrix.firstFloor.seats.find(
        (seat: MatrixSeat) => seat.name === seatNumber
      ) ||
      bus.seatMatrix.secondFloor?.seats.find(
        (seat: MatrixSeat) => seat.name === seatNumber
      );

    const seatInDb = seats.find(
      (seat: BusSeat) => seat.seatNumber === seatNumber
    );

    // Set the current values
    setIsSeatEmpty(seatInMatrix?.isEmpty || false);
    setSeatType(seatInDb?.tierId || seatTiers[0]?.id || "");
    setSeatStatus(seatInDb?.status || "available");
  };

  // Add this function to save the selected seat
  const handleSaveSeat = () => {
    if (!selectedSeat) return;

    // Create a copy of the current seats
    const updatedSeats = [...seats];

    // Find the seat in the current configuration
    const seatIndex = updatedSeats.findIndex(
      (seat) => seat.seatNumber === selectedSeat
    );

    if (isSeatEmpty) {
      // If the seat is empty, remove it from the seats array
      if (seatIndex !== -1) {
        updatedSeats.splice(seatIndex, 1);
      }

      // Update the matrix to mark the seat as empty
      const updatedMatrix = JSON.parse(JSON.stringify(bus.seatMatrix));
      const firstFloorSeat = updatedMatrix.firstFloor.seats.find(
        (seat: MatrixSeat) => seat.name === selectedSeat
      );

      if (firstFloorSeat) {
        firstFloorSeat.isEmpty = true;
      } else if (updatedMatrix.secondFloor) {
        const secondFloorSeat = updatedMatrix.secondFloor.seats.find(
          (seat: MatrixSeat) => seat.name === selectedSeat
        );
        if (secondFloorSeat) {
          secondFloorSeat.isEmpty = true;
        }
      }

      // Update the matrix
      updateBus.mutateAsync({
        id: bus.id,
        data: { seatMatrix: updatedMatrix },
      });
    } else {
      // If the seat exists, update it
      if (seatIndex !== -1) {
        updatedSeats[seatIndex] = {
          ...updatedSeats[seatIndex],
          tierId: seatType,
          status: seatStatus,
          isActive: seatStatus === "available",
        };
      } else {
        // If the seat doesn't exist, add it
        updatedSeats.push({
          busId: bus.id,
          seatNumber: selectedSeat,
          tierId: seatType,
          status: seatStatus,
          isActive: seatStatus === "available",
        } as BusSeat);
      }

      // Update the matrix to mark the seat as not empty
      const updatedMatrix = JSON.parse(JSON.stringify(bus.seatMatrix));
      const firstFloorSeat = updatedMatrix.firstFloor.seats.find(
        (seat: MatrixSeat) => seat.name === selectedSeat
      );

      if (firstFloorSeat) {
        firstFloorSeat.isEmpty = false;
      } else if (updatedMatrix.secondFloor) {
        const secondFloorSeat = updatedMatrix.secondFloor.seats.find(
          (seat: MatrixSeat) => seat.name === selectedSeat
        );
        if (secondFloorSeat) {
          secondFloorSeat.isEmpty = false;
        }
      }

      // Update the matrix
      updateBus.mutateAsync({
        id: bus.id,
        data: { seatMatrix: updatedMatrix },
      });
    }

    // Update the seats
    handleUpdateSeats(updatedSeats);

    // Clear selection
    setSelectedSeat(null);
  };

  // Add this function to handle seat selection for bulk editing
  const handleSeatSelection = (seatNumber: string) => {
    if (!bulkEditMode) {
      // Single seat mode - just select this seat
      handleSeatClick(seatNumber);
      return;
    }

    // Bulk edit mode - toggle selection
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  // Add this function to apply changes to multiple seats
  const handleBulkUpdate = () => {
    if (selectedSeats.length === 0) return;

    // Create a copy of the current seats
    const updatedSeats = [...seats];

    // Update each selected seat
    for (const seatNumber of selectedSeats) {
      const seatIndex = updatedSeats.findIndex(
        (seat) => seat.seatNumber === seatNumber
      );

      if (isSeatEmpty) {
        // If marking as empty, remove from seats array
        if (seatIndex !== -1) {
          updatedSeats.splice(seatIndex, 1);
        }

        // Update the matrix to mark the seat as empty
        const updatedMatrix = JSON.parse(JSON.stringify(bus.seatMatrix));
        const firstFloorSeat = updatedMatrix.firstFloor.seats.find(
          (seat: MatrixSeat) => seat.name === seatNumber
        );

        if (firstFloorSeat) {
          firstFloorSeat.isEmpty = true;
        } else if (updatedMatrix.secondFloor) {
          const secondFloorSeat = updatedMatrix.secondFloor.seats.find(
            (seat: MatrixSeat) => seat.name === seatNumber
          );
          if (secondFloorSeat) {
            secondFloorSeat.isEmpty = true;
          }
        }

        // Update the matrix
        updateBus.mutateAsync({
          id: bus.id,
          data: { seatMatrix: updatedMatrix },
        });
      } else {
        // If the seat exists, update it
        if (seatIndex !== -1) {
          updatedSeats[seatIndex] = {
            ...updatedSeats[seatIndex],
            tierId: seatType,
            status: seatStatus,
            isActive: seatStatus === "available",
          };
        } else {
          // If the seat doesn't exist, add it
          updatedSeats.push({
            busId: bus.id,
            seatNumber: seatNumber,
            tierId: seatType,
            status: seatStatus,
            isActive: seatStatus === "available",
          } as BusSeat);
        }
      }
    }

    // Update all seats
    handleUpdateSeats(updatedSeats);

    // Clear selection
    setSelectedSeats([]);
    setBulkEditMode(false);
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="seats">Asientos</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Información del Bus</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            disabled={true}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar plantilla" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {templates.map((template: BusTemplate) => (
                                <SelectItem
                                  key={template.id}
                                  value={template.id}
                                >
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground mt-1">
                            La plantilla no se puede cambiar después de crear el
                            bus.
                          </p>
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
                              Marque esta opción si el bus está activo en el
                              sistema
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

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seats">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Configuración de Asientos</span>
                <div className="flex items-center gap-2">
                  <Switch
                    id="bulk-edit"
                    checked={bulkEditMode}
                    onCheckedChange={setBulkEditMode}
                  />
                  <Label htmlFor="bulk-edit" className="text-sm">
                    Edición múltiple
                  </Label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Seat Matrix Viewer */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">
                        {bulkEditMode
                          ? `Seleccione asientos (${selectedSeats.length} seleccionados)`
                          : "Seleccione un asiento para configurar"}
                      </h3>

                      {bulkEditMode && selectedSeats.length > 0 && (
                        <div className="flex justify-between items-center mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSeats([])}
                          >
                            Limpiar selección
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleBulkUpdate}
                            disabled={isUpdatingSeats}
                          >
                            {isUpdatingSeats ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Actualizando...
                              </>
                            ) : (
                              "Aplicar a seleccionados"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Use SeatMatrixViewer with custom rendering for selection */}
                    <div className="border rounded-md p-2">
                      <Tabs defaultValue="firstFloor">
                        <TabsList className="mb-4">
                          <TabsTrigger value="firstFloor">
                            Primer Piso
                          </TabsTrigger>
                          {bus.seatMatrix.secondFloor && (
                            <TabsTrigger value="secondFloor">
                              Segundo Piso
                            </TabsTrigger>
                          )}
                        </TabsList>

                        <TabsContent value="firstFloor">
                          <div className="space-y-4">
                            <div className="grid gap-1">
                              {Array.from({
                                length:
                                  bus.seatMatrix.firstFloor.dimensions.rows,
                              }).map((_, rowIndex) => (
                                <div
                                  key={`first-floor-row-${rowIndex}-${bus.id}`}
                                  className="flex gap-1"
                                >
                                  {bus.seatMatrix.firstFloor.seats
                                    .filter(
                                      (seat: MatrixSeat) =>
                                        seat.row === rowIndex
                                    )
                                    .map((seat: MatrixSeat) => {
                                      const busSeat = seats.find(
                                        (s: BusSeat) =>
                                          s.seatNumber === seat.name
                                      );
                                      const isSelected = bulkEditMode
                                        ? selectedSeats.includes(seat.name)
                                        : selectedSeat === seat.name;

                                      // Find the seat tier
                                      const seatTier = seatTiers.find(
                                        (tier: SeatTier) =>
                                          busSeat
                                            ? tier.id === busSeat.tierId
                                            : tier.id === seat.tierId
                                      );

                                      // Get tier abbreviation for display
                                      const tierAbbr = seatTier?.name
                                        ? seatTier.name.substring(0, 2)
                                        : "";

                                      return (
                                        <button
                                          key={seat.id}
                                          type="button"
                                          className={`w-10 h-10 flex flex-col items-center justify-center rounded-sm border text-xs font-medium 
                                            ${seat.isEmpty ? "bg-gray-100 border-dashed border-gray-300" : ""}
                                            ${!seat.isEmpty && !seatTier ? "bg-red-50 border-red-300 text-red-700" : ""}
                                            ${!seat.isEmpty && seatTier && busSeat?.status === "available" ? "bg-white border-primary text-primary" : ""}
                                            ${!seat.isEmpty && busSeat?.status === "maintenance" ? "bg-gray-200 border-gray-500 text-gray-700" : ""}
                                            ${isSelected ? "ring-2 ring-offset-1 ring-primary" : ""}
                                          `}
                                          onClick={() =>
                                            handleSeatSelection(seat.name)
                                          }
                                          title={`${seat.name}${seatTier ? ` - ${seatTier.name}` : ""}`}
                                        >
                                          {!seat.isEmpty && (
                                            <>
                                              <span className="text-[10px] font-semibold">
                                                {tierAbbr}
                                              </span>
                                              <span>{seat.name}</span>
                                            </>
                                          )}
                                        </button>
                                      );
                                    })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        {bus.seatMatrix.secondFloor && (
                          <TabsContent value="secondFloor">
                            <div className="space-y-4">
                              <div className="grid gap-1">
                                {Array.from({
                                  length:
                                    bus.seatMatrix.secondFloor.dimensions.rows,
                                }).map((_, rowIndex) => (
                                  <div
                                    key={`second-floor-row-${rowIndex}-${bus.id}`}
                                    className="flex gap-1"
                                  >
                                    {bus.seatMatrix.secondFloor?.seats
                                      .filter(
                                        (seat: MatrixSeat) =>
                                          seat.row === rowIndex
                                      )
                                      .map((seat: MatrixSeat) => {
                                        const busSeat = seats.find(
                                          (s: BusSeat) =>
                                            s.seatNumber === seat.name
                                        );
                                        const isSelected = bulkEditMode
                                          ? selectedSeats.includes(seat.name)
                                          : selectedSeat === seat.name;

                                        // Find the seat tier
                                        const seatTier = seatTiers.find(
                                          (tier: SeatTier) =>
                                            busSeat
                                              ? tier.id === busSeat.tierId
                                              : tier.id === seat.tierId
                                        );

                                        // Get tier abbreviation for display
                                        const tierAbbr = seatTier?.name
                                          ? seatTier.name.substring(0, 2)
                                          : "";

                                        return (
                                          <button
                                            key={seat.id}
                                            type="button"
                                            className={`w-10 h-10 flex flex-col items-center justify-center rounded-sm border text-xs font-medium 
                                              ${seat.isEmpty ? "bg-gray-100 border-dashed border-gray-300" : ""}
                                              ${!seat.isEmpty && !seatTier ? "bg-red-50 border-red-300 text-red-700" : ""}
                                              ${!seat.isEmpty && seatTier && busSeat?.status === "available" ? "bg-white border-primary text-primary" : ""}
                                              ${!seat.isEmpty && busSeat?.status === "maintenance" ? "bg-gray-200 border-gray-500 text-gray-700" : ""}
                                              ${isSelected ? "ring-2 ring-offset-1 ring-primary" : ""}
                                            `}
                                            onClick={() =>
                                              handleSeatSelection(seat.name)
                                            }
                                            title={`${seat.name}${seatTier ? ` - ${seatTier.name}` : ""}`}
                                          >
                                            {!seat.isEmpty && (
                                              <>
                                                <span className="text-[10px] font-semibold">
                                                  {tierAbbr}
                                                </span>
                                                <span>{seat.name}</span>
                                              </>
                                            )}
                                          </button>
                                        );
                                      })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>
                  </div>

                  {/* Seat Configuration Panel */}
                  <div>
                    {bulkEditMode ? (
                      <div className="space-y-4 border p-4 rounded-md">
                        <h3 className="text-sm font-medium">
                          Configurar {selectedSeats.length} asientos
                          seleccionados
                        </h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="bulk-is-empty">Espacio Vacío</Label>
                            <Switch
                              id="bulk-is-empty"
                              checked={isSeatEmpty}
                              onCheckedChange={setIsSeatEmpty}
                            />
                          </div>

                          {!isSeatEmpty && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="bulk-seat-type">
                                  Tipo de Asiento
                                </Label>
                                <Select
                                  value={seatType}
                                  onValueChange={setSeatType}
                                >
                                  <SelectTrigger id="bulk-seat-type">
                                    <SelectValue placeholder="Seleccionar tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {seatTiers.map((tier: SeatTier) => (
                                      <SelectItem key={tier.id} value={tier.id}>
                                        {tier.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="bulk-seat-status">Estado</Label>
                                <Select
                                  value={seatStatus}
                                  onValueChange={setSeatStatus}
                                >
                                  <SelectTrigger id="bulk-seat-status">
                                    <SelectValue placeholder="Seleccionar estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">
                                      Disponible
                                    </SelectItem>
                                    <SelectItem value="maintenance">
                                      Mantenimiento
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : selectedSeat ? (
                      <div className="space-y-4 border p-4 rounded-md">
                        <h3 className="text-sm font-medium">
                          Configurar Asiento {selectedSeat}
                        </h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="is-empty">Espacio Vacío</Label>
                            <Switch
                              id="is-empty"
                              checked={isSeatEmpty}
                              onCheckedChange={setIsSeatEmpty}
                            />
                          </div>

                          {!isSeatEmpty && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="seat-type">
                                  Tipo de Asiento
                                </Label>
                                <Select
                                  value={seatType}
                                  onValueChange={setSeatType}
                                >
                                  <SelectTrigger id="seat-type">
                                    <SelectValue placeholder="Seleccionar tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {seatTiers.map((tier: SeatTier) => (
                                      <SelectItem key={tier.id} value={tier.id}>
                                        {tier.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="seat-status">Estado</Label>
                                <Select
                                  value={seatStatus}
                                  onValueChange={setSeatStatus}
                                >
                                  <SelectTrigger id="seat-status">
                                    <SelectValue placeholder="Seleccionar estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">
                                      Disponible
                                    </SelectItem>
                                    <SelectItem value="maintenance">
                                      Mantenimiento
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedSeat(null)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleSaveSeat}
                              disabled={isUpdatingSeats}
                            >
                              {isUpdatingSeats ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Guardando...
                                </>
                              ) : (
                                "Guardar"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full border border-dashed p-8 rounded-md">
                        <p className="text-muted-foreground">
                          Seleccione un asiento para configurar o active el modo
                          de edición múltiple
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium">Leyenda</h4>
                  <div className="flex flex-wrap gap-3">
                    {seatTiers.map((tier: SeatTier) => (
                      <div key={tier.id} className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white border border-primary rounded-sm" />
                        <span className="text-sm">{tier.name}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 border border-gray-500 rounded-sm" />
                      <span className="text-sm">Mantenimiento</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 border border-dashed border-gray-300 rounded-sm" />
                      <span className="text-sm">Espacio vacío</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Mantenimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Estado Actual</h3>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        bus.maintenanceStatus === "active"
                          ? "bg-green-500"
                          : bus.maintenanceStatus === "in_maintenance"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    />
                    <span>
                      {bus.maintenanceStatus === "active" && "Operativo"}
                      {bus.maintenanceStatus === "in_maintenance" &&
                        "En Mantenimiento"}
                      {bus.maintenanceStatus === "retired" && "Retirado"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Cambiar Estado</h3>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant={
                        bus.maintenanceStatus === "active"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleUpdateMaintenanceStatus("active")}
                      disabled={
                        isUpdatingMaintenance ||
                        bus.maintenanceStatus === "active"
                      }
                    >
                      Marcar como Operativo
                    </Button>
                    <Button
                      variant={
                        bus.maintenanceStatus === "in_maintenance"
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        handleUpdateMaintenanceStatus("in_maintenance")
                      }
                      disabled={
                        isUpdatingMaintenance ||
                        bus.maintenanceStatus === "in_maintenance"
                      }
                    >
                      Marcar como En Mantenimiento
                    </Button>
                    <Button
                      variant={
                        bus.maintenanceStatus === "retired"
                          ? "default"
                          : "destructive"
                      }
                      onClick={() => handleUpdateMaintenanceStatus("retired")}
                      disabled={
                        isUpdatingMaintenance ||
                        bus.maintenanceStatus === "retired"
                      }
                    >
                      Marcar como Retirado
                    </Button>
                  </div>
                </div>

                {isUpdatingMaintenance && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Actualizando estado...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 