"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSchedules, type ScheduleFormData } from "@/hooks/use-schedules";
import { type Bus, useBuses } from "@/hooks/use-buses";
import { type Driver, useDrivers } from "@/hooks/use-drivers";
import { useRouteSchedules, type RouteSchedule } from "@/hooks/use-route-schedules";
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
import { format, addMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  routeScheduleId: z.string().optional(),
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

type CreateScheduleFormValues = z.infer<typeof formSchema>;

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
}

export function CreateScheduleDialog({
  open,
  onOpenChange,
  routeId,
}: CreateScheduleDialogProps) {
  const { createSchedule, isCreating } = useSchedules();
  const { buses, isLoadingBuses } = useBuses(true);
  const { drivers, isLoadingDrivers } = useDrivers(true);
  const { routeSchedules, isLoadingRouteSchedules } = useRouteSchedules({
    routeId,
  });
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateScheduleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeScheduleId: "",
      busId: "",
      primaryDriverId: "",
      secondaryDriverId: "",
      price: 0,
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        routeScheduleId: "",
        busId: "",
        primaryDriverId: "",
        secondaryDriverId: "",
        price: 0,
      });
    }
  }, [open, form]);

  // Update estimated arrival time when route schedule changes
  useEffect(() => {
    const routeScheduleId = form.watch("routeScheduleId");
    const departureDate = form.watch("departureDate");

    if (routeScheduleId && departureDate) {
      const routeSchedule = routeSchedules.find(
        (rs: RouteSchedule) => rs.id === routeScheduleId
      );

      if (routeSchedule?.route) {
        // Calculate estimated arrival time based on departure time and route duration
        const estimatedArrivalTime = addMinutes(
          departureDate,
          routeSchedule.route.estimatedDuration
        );

        form.setValue("estimatedArrivalTime", estimatedArrivalTime);
      }
    }
  }, [routeSchedules, form]);

  const onSubmit = async (data: CreateScheduleFormValues) => {
    setError(null);
    
    try {
      const scheduleData: ScheduleFormData = {
        routeId,
        busId: data.busId,
        routeScheduleId: data.routeScheduleId,
        primaryDriverId: data.primaryDriverId,
        secondaryDriverId:
          data.secondaryDriverId === "none"
            ? undefined
            : data.secondaryDriverId,
        departureDate: data.departureDate.toISOString(),
        estimatedArrivalTime: data.estimatedArrivalTime.toISOString(),
        price: data.price,
      };

      await createSchedule.mutateAsync(scheduleData);
      form.reset();
      onOpenChange(false);
    } catch {
      setError("Error al crear el viaje. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Programar Nuevo Viaje</DialogTitle>
          <DialogDescription>
            Complete la información para programar un nuevo viaje en esta ruta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="routeScheduleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horario de Ruta (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingRouteSchedules}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar horario (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Ninguno</SelectItem>
                      {routeSchedules.map((routeSchedule: RouteSchedule) => (
                        <SelectItem
                          key={routeSchedule.id}
                          value={routeSchedule.id}
                        >
                          {`${format(new Date(routeSchedule.departureTime), "HH:mm")} - ${
                            ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][
                              Number.parseInt(
                                routeSchedule.operatingDays.split(",")[0]
                              )
                            ]
                          }`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          onSelect={field.onChange}
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
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const departureDate = form.watch("departureDate");
                            return departureDate && date < departureDate;
                          }}
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
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Programar Viaje
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 