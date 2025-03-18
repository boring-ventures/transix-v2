"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSchedules, type ScheduleFormData } from "@/hooks/use-schedules";
import { type Bus, useBuses } from "@/hooks/use-buses";
import { type Driver, useDrivers } from "@/hooks/use-drivers";
import { Route, useRoutes } from "@/hooks/use-routes";
import {
  useRouteSchedules,
  type RouteSchedule,
} from "@/hooks/use-route-schedules";
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
import { format, addMinutes, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  routeId: z.string().min(1, "Debe seleccionar una ruta"),
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

export function CreateSchedulePage() {
  const router = useRouter();
  const { createSchedule, isCreating } = useSchedules();
  const { buses, isLoadingBuses } = useBuses(true);
  const { drivers, isLoadingDrivers } = useDrivers(true);
  const { routes, isLoading: isLoadingRoutes } = useRoutes();
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const { routeSchedules, isLoadingRouteSchedules } = useRouteSchedules({
    routeId: selectedRouteId,
    active: true,
  });
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateScheduleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeId: "",
      routeScheduleId: "none",
      busId: "",
      primaryDriverId: "",
      secondaryDriverId: "none",
      price: 0,
    },
  });

  // Filter out expired route schedules (where seasonEnd is before the current date)
  const validRouteSchedules = useMemo(() => {
    const today = new Date();
    return routeSchedules.filter((schedule: RouteSchedule) => {
      // If there is no seasonEnd, keep the schedule
      if (!schedule.seasonEnd) return true;
      // Keep the schedule if seasonEnd is after today
      return isAfter(parseISO(schedule.seasonEnd), today);
    });
  }, [routeSchedules]);

  // Update route schedules when route changes
  useEffect(() => {
    const routeId = form.watch("routeId");
    if (routeId) {
      setSelectedRouteId(routeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("routeId")]);

  // Update estimated arrival time when route schedule changes
  useEffect(() => {
    const routeScheduleId = form.watch("routeScheduleId");
    const departureDate = form.watch("departureDate");
    const routeId = form.watch("routeId");

    if (routeScheduleId && routeScheduleId !== "none" && departureDate) {
      const routeSchedule = routeSchedules.find(
        (rs: RouteSchedule) => rs.id === routeScheduleId
      );

      if (routeSchedule?.route) {
        // Get the departure time from the selected route schedule
        const scheduleDepartureTime = new Date(routeSchedule.departureTime);

        // Create a new date with the selected departure date but time from the route schedule
        const newDepartureDate = new Date(departureDate);
        newDepartureDate.setHours(
          scheduleDepartureTime.getHours(),
          scheduleDepartureTime.getMinutes()
        );

        // Update the departure date with the time from the schedule
        form.setValue("departureDate", newDepartureDate);

        // Calculate estimated arrival time based on departure time and route duration
        const estimatedArrivalTime = addMinutes(
          newDepartureDate,
          routeSchedule.route.estimatedDuration
        );

        form.setValue("estimatedArrivalTime", estimatedArrivalTime);
      }
    } else if (routeId && departureDate) {
      // If no route schedule is selected, try to get the route directly
      const route = routes.find((r: Route) => r.id === routeId);
      if (route) {
        // Calculate estimated arrival time based on departure time and route duration
        const estimatedArrivalTime = addMinutes(
          departureDate,
          route.estimatedDuration
        );
        form.setValue("estimatedArrivalTime", estimatedArrivalTime);
      }
    }
  }, [routeSchedules, form, routes]);

  const onSubmit = async (data: CreateScheduleFormValues) => {
    setError(null);

    try {
      const scheduleData: ScheduleFormData = {
        routeId: data.routeId,
        busId: data.busId,
        routeScheduleId:
          data.routeScheduleId === "none" ? undefined : data.routeScheduleId,
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
      router.push("/schedules");
    } catch {
      setError("Error al crear el viaje. Por favor, inténtelo de nuevo.");
    }
  };

  const isLoading =
    isLoadingBuses ||
    isLoadingDrivers ||
    isLoadingRoutes ||
    isLoadingRouteSchedules;

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => router.push("/schedules")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Crear Nuevo Viaje</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Viaje</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="routeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ruta</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingRoutes}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar ruta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {routes.map((route: Route) => (
                            <SelectItem key={route.id} value={route.id}>
                              {route.name}
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
                  name="routeScheduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario de Ruta (Opcional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingRouteSchedules || !selectedRouteId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar horario (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Ninguno</SelectItem>
                          {validRouteSchedules.map(
                            (routeSchedule: RouteSchedule) => {
                              // Format operating days for better display
                              const daysMap: Record<string, string> = {
                                "0": "Dom",
                                "1": "Lun",
                                "2": "Mar",
                                "3": "Mié",
                                "4": "Jue",
                                "5": "Vie",
                                "6": "Sáb",
                              };

                              // Show season information in the label when available
                              let seasonInfo = "";
                              if (
                                routeSchedule.seasonStart ||
                                routeSchedule.seasonEnd
                              ) {
                                seasonInfo = " - Temporada: ";
                                if (routeSchedule.seasonStart) {
                                  seasonInfo += format(
                                    parseISO(routeSchedule.seasonStart),
                                    "dd/MM/yyyy",
                                    { locale: es }
                                  );
                                } else {
                                  seasonInfo += "Sin inicio";
                                }
                                seasonInfo += " a ";
                                if (routeSchedule.seasonEnd) {
                                  seasonInfo += format(
                                    parseISO(routeSchedule.seasonEnd),
                                    "dd/MM/yyyy",
                                    { locale: es }
                                  );
                                } else {
                                  seasonInfo += "Sin fin";
                                }
                              }

                              const days = routeSchedule.operatingDays
                                .split(",")
                                .map((day) => daysMap[day] || day)
                                .join(", ");

                              const departureTime = format(
                                new Date(routeSchedule.departureTime),
                                "HH:mm",
                                { locale: es }
                              );

                              return (
                                <SelectItem
                                  key={routeSchedule.id}
                                  value={routeSchedule.id}
                                >
                                  {days} - {departureTime}
                                  {seasonInfo}
                                </SelectItem>
                              );
                            }
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                              {bus.plateNumber}
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
                                }
                                field.onChange(newDate);
                              }
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                          <div className="p-3 border-t border-border">
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={
                                  field.value
                                    ? format(field.value, "HH:mm")
                                    : ""
                                }
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value
                                    .split(":")
                                    .map(Number);
                                  const newDate = field.value
                                    ? new Date(field.value)
                                    : new Date();
                                  newDate.setHours(hours, minutes);
                                  field.onChange(newDate);
                                }}
                              />
                            </div>
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
                                }
                                field.onChange(newDate);
                              }
                            }}
                            disabled={(date) => {
                              const departureDate =
                                form.getValues("departureDate");
                              return (
                                date < new Date() ||
                                (departureDate && date < departureDate)
                              );
                            }}
                            initialFocus
                          />
                          <div className="p-3 border-t border-border">
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={
                                  field.value
                                    ? format(field.value, "HH:mm")
                                    : ""
                                }
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value
                                    .split(":")
                                    .map(Number);
                                  const newDate = field.value
                                    ? new Date(field.value)
                                    : new Date();
                                  newDate.setHours(hours, minutes);
                                  field.onChange(newDate);
                                }}
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio (Bs.)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {error && (
                <div className="text-destructive text-sm mt-2">{error}</div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/schedules")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating || isLoading}>
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Crear Viaje
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
