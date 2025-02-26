"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSchedules, type Schedule } from "@/hooks/use-schedules";
import { type Bus, useBuses } from "@/hooks/use-buses";
import { type Driver, useDrivers } from "@/hooks/use-drivers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  busId: z.string().min(1, "Debe seleccionar un bus"),
  primaryDriverId: z.string().min(1, "Debe seleccionar un conductor principal"),
  secondaryDriverId: z.string().optional(),
  departureDate: z.date({
    required_error: "Debe seleccionar una fecha de salida",
  }),
  estimatedArrivalTime: z.date({
    required_error: "Debe seleccionar una hora estimada de llegada",
  }),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
});

type EditScheduleFormValues = z.infer<typeof formSchema>;

interface EditScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule;
  onUpdate: (schedule: Schedule) => void;
}

export function EditScheduleDialog({
  open,
  onOpenChange,
  schedule,
  onUpdate,
}: EditScheduleDialogProps) {
  const { updateSchedule, isUpdating } = useSchedules();
  const { buses, isLoadingBuses } = useBuses(true);
  const { drivers, isLoadingDrivers } = useDrivers(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditScheduleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      busId: schedule.busId || "",
      primaryDriverId: schedule.primaryDriverId || "",
      secondaryDriverId: schedule.secondaryDriverId || "none",
      departureDate: new Date(schedule.departureDate),
      estimatedArrivalTime: new Date(schedule.estimatedArrivalTime),
      price: schedule.price,
    },
  });

  const onSubmit = async (data: EditScheduleFormValues) => {
    setError(null);
    
    try {
      const updatedSchedule = await updateSchedule.mutateAsync({
        id: schedule.id,
        data: {
          busId: data.busId,
          primaryDriverId: data.primaryDriverId,
          secondaryDriverId:
            data.secondaryDriverId === "none"
              ? undefined
              : data.secondaryDriverId,
          departureDate: data.departureDate.toISOString(),
          estimatedArrivalTime: data.estimatedArrivalTime.toISOString(),
          price: data.price,
        },
      });
      
      onUpdate(updatedSchedule);
      onOpenChange(false);
    } catch {
      setError("Error al actualizar el viaje. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Viaje</DialogTitle>
          <DialogDescription>
            Modifique la información del viaje programado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha y Hora de Salida</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm", {
                                locale: es,
                              })
                            ) : (
                              <span>Seleccionar fecha y hora</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              // Preserve the time when changing the date
                              const newDate = new Date(date);
                              if (field.value) {
                                newDate.setHours(
                                  field.value.getHours(),
                                  field.value.getMinutes()
                                );
                              } else {
                                // Default to current time if no time was set before
                                const now = new Date();
                                newDate.setHours(
                                  now.getHours(),
                                  now.getMinutes()
                                );
                              }
                              field.onChange(newDate);
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                        <div className="p-3 border-t border-border">
                          <Input
                            type="time"
                            value={
                              field.value ? format(field.value, "HH:mm") : ""
                            }
                            onChange={(e) => {
                              const [hours, minutes] =
                                e.target.value.split(":");
                              const newDate = new Date(
                                field.value || new Date()
                              );
                              newDate.setHours(
                                Number.parseInt(hours),
                                Number.parseInt(minutes)
                              );
                              field.onChange(newDate);
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedArrivalTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Hora Estimada de Llegada</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm", {
                                locale: es,
                              })
                            ) : (
                              <span>Seleccionar fecha y hora</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              // Preserve the time when changing the date
                              const newDate = new Date(date);
                              if (field.value) {
                                newDate.setHours(
                                  field.value.getHours(),
                                  field.value.getMinutes()
                                );
                              } else {
                                // Default to current time if no time was set before
                                const now = new Date();
                                newDate.setHours(now.getHours(), now.getMinutes());
                              }
                              field.onChange(newDate);
                            }
                          }}
                          disabled={(date) => {
                            const departureDate = form.watch("departureDate");
                            // Only disable dates before the departure date
                            if (departureDate) {
                              // Compare only the date part, not the time
                              const departureDateOnly = new Date(departureDate);
                              departureDateOnly.setHours(0, 0, 0, 0);
                              
                              const dateToCheck = new Date(date);
                              dateToCheck.setHours(0, 0, 0, 0);
                              
                              return dateToCheck < departureDateOnly;
                            }
                            return date < new Date();
                          }}
                          initialFocus
                        />
                        <div className="p-3 border-t border-border">
                          <Input
                            type="time"
                            value={field.value ? format(field.value, "HH:mm") : ""}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":");
                              const newDate = new Date(field.value || new Date());
                              newDate.setHours(
                                Number.parseInt(hours),
                                Number.parseInt(minutes)
                              );
                              
                              // Ensure arrival time is after departure time on the same day
                              const departureDate = form.watch("departureDate");
                              if (departureDate && isSameDay(departureDate, newDate)) {
                                const departureTime = departureDate.getTime();
                                const arrivalTime = newDate.getTime();
                                
                                if (arrivalTime <= departureTime) {
                                  // If arrival time is before or equal to departure time,
                                  // set it to departure time + 15 minutes
                                  newDate.setTime(departureTime + 15 * 60 * 1000);
                                }
                              }
                              
                              field.onChange(newDate);
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="busId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingBuses}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar bus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buses.map((bus: Bus) => (
                          <SelectItem key={bus.id} value={bus.id}>
                            {bus.plateNumber} - {bus.template?.name || ""}
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Base</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Precio del boleto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryDriverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conductor Principal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingDrivers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar conductor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drivers.map((driver: Driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.fullName}
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
                name="secondaryDriverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conductor Secundario (Opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingDrivers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar conductor secundario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Ninguno</SelectItem>
                        {drivers
                          .filter(
                            (driver: Driver) =>
                              driver.id !== form.watch("primaryDriverId")
                          )
                          .map((driver: Driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.fullName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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