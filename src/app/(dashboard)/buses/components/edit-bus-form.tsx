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
import { SeatMatrixEditor } from "./seat-matrix-editor";
import { toast } from "@/components/ui/use-toast";
import type { MaintenanceStatus } from "@prisma/client";
import type { BusSeat } from "@/hooks/use-bus-seats";

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
  const { updateBus, isUpdating, updateMaintenanceStatus, isUpdatingMaintenance } = useBuses();
  const { companies } = useCompanies();
  const { templates } = useBusTemplates();
  const { seats, updateBusSeats, isUpdatingSeats } = useBusSeats(bus.id);
  const { seatTiers } = useSeatTiers(bus.companyId);
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(bus.companyId);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

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

  // Filter templates by company
  const filteredTemplates = templates.filter(
    (template: BusTemplate) => !selectedCompanyId || template.companyId === selectedCompanyId
  );

  // Handle company change
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    form.setValue("companyId", value);
    form.setValue("templateId", ""); // Reset template when company changes
  };

  const onSubmit = async (data: EditBusFormValues) => {
    setError(null);
    
    try {
      await updateBus.mutateAsync({ 
        id: bus.id, 
        data: data as Partial<BusFormData> 
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
        description: "El estado de mantenimiento ha sido actualizado correctamente",
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
      await updateBusSeats.mutateAsync({
        busId: bus.id,
        seats: updatedSeats,
      });
      
      toast({
        title: "Asientos actualizados",
        description: "La configuración de asientos ha sido actualizada correctamente",
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!selectedCompanyId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar plantilla" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredTemplates.map((template: BusTemplate) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name} ({template.totalCapacity} asientos)
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
                              Marque esta opción si el bus está activo en el sistema
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
              <CardTitle>Configuración de Asientos</CardTitle>
            </CardHeader>
            <CardContent>
              <SeatMatrixEditor
                matrix={bus.seatMatrix}
                seatTiers={seatTiers || []}
                seats={seats}
                onUpdate={handleUpdateSeats}
                isUpdating={isUpdatingSeats}
              />
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
                    <div className={`w-3 h-3 rounded-full ${
                      bus.maintenanceStatus === "active" ? "bg-green-500" :
                      bus.maintenanceStatus === "in_maintenance" ? "bg-yellow-500" :
                      "bg-red-500"
                    }`} />
                    <span>
                      {bus.maintenanceStatus === "active" && "Operativo"}
                      {bus.maintenanceStatus === "in_maintenance" && "En Mantenimiento"}
                      {bus.maintenanceStatus === "retired" && "Retirado"}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Cambiar Estado</h3>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant={bus.maintenanceStatus === "active" ? "default" : "outline"}
                      onClick={() => handleUpdateMaintenanceStatus("active")}
                      disabled={isUpdatingMaintenance || bus.maintenanceStatus === "active"}
                    >
                      Marcar como Operativo
                    </Button>
                    <Button 
                      variant={bus.maintenanceStatus === "in_maintenance" ? "default" : "outline"}
                      onClick={() => handleUpdateMaintenanceStatus("in_maintenance")}
                      disabled={isUpdatingMaintenance || bus.maintenanceStatus === "in_maintenance"}
                    >
                      Marcar como En Mantenimiento
                    </Button>
                    <Button 
                      variant={bus.maintenanceStatus === "retired" ? "default" : "destructive"}
                      onClick={() => handleUpdateMaintenanceStatus("retired")}
                      disabled={isUpdatingMaintenance || bus.maintenanceStatus === "retired"}
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