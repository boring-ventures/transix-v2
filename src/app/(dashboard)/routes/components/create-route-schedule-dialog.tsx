"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouteSchedules, type RouteSchedule, type RouteScheduleFormData } from "@/hooks/use-route-schedules";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  operatingDays: z.string().min(1, "Debe seleccionar al menos un día"),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Formato de hora inválido. Use HH:MM (24h)",
  }),
  estimatedArrivalTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Formato de hora inválido. Use HH:MM (24h)",
  }),
  seasonStart: z.date().optional(),
  seasonEnd: z.date().optional(),
  active: z.boolean().default(true),
});

type RouteScheduleFormValues = z.infer<typeof formSchema>;

interface CreateRouteScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  routeSchedule?: RouteSchedule;
}

export function CreateRouteScheduleDialog({
  open,
  onOpenChange,
  routeId,
  routeSchedule,
}: CreateRouteScheduleDialogProps) {
  const { createRouteSchedule, updateRouteSchedule, isCreating, isUpdating } = useRouteSchedules();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!routeSchedule;

  const form = useForm<RouteScheduleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operatingDays: "1,2,3,4,5", // Monday to Friday
      departureTime: "08:00",
      estimatedArrivalTime: "10:00",
      active: true,
    },
  });

  // Update form when editing
  useEffect(() => {
    if (routeSchedule) {
      form.reset({
        operatingDays: routeSchedule.operatingDays,
        departureTime: new Date(routeSchedule.departureTime).toISOString().substring(11, 16), // HH:MM format
        estimatedArrivalTime: new Date(routeSchedule.estimatedArrivalTime).toISOString().substring(11, 16),
        seasonStart: routeSchedule.seasonStart ? new Date(routeSchedule.seasonStart) : undefined,
        seasonEnd: routeSchedule.seasonEnd ? new Date(routeSchedule.seasonEnd) : undefined,
        active: routeSchedule.active,
      });
    } else {
      form.reset({
        operatingDays: "1,2,3,4,5",
        departureTime: "08:00",
        estimatedArrivalTime: "10:00",
        active: true,
      });
    }
  }, [routeSchedule, form]);

  const onSubmit = async (data: RouteScheduleFormValues) => {
    setError(null);
    
    try {
      if (isEditing && routeSchedule) {
        await updateRouteSchedule.mutateAsync({
          id: routeSchedule.id,
          data: {
            operatingDays: data.operatingDays,
            departureTime: data.departureTime,
            estimatedArrivalTime: data.estimatedArrivalTime,
            seasonStart: data.seasonStart,
            seasonEnd: data.seasonEnd,
            active: data.active,
          },
        });
      } else {
        const scheduleData: RouteScheduleFormData = {
          routeId,
          operatingDays: data.operatingDays,
          departureTime: data.departureTime,
          estimatedArrivalTime: data.estimatedArrivalTime,
          seasonStart: data.seasonStart,
          seasonEnd: data.seasonEnd,
          active: data.active,
        };
        
        await createRouteSchedule.mutateAsync(scheduleData);
      }
      
      form.reset();
      onOpenChange(false);
    } catch {
      setError(`Error al ${isEditing ? 'actualizar' : 'crear'} el horario. Por favor, inténtelo de nuevo.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Horario" : "Crear Nuevo Horario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifique la información del horario programado."
              : "Configure un nuevo horario regular para esta ruta."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="operatingDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Días de Operación</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: 1,2,3,4,5 (Lun-Vie)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departureTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Salida</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedArrivalTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Llegada</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="seasonStart"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Inicio de Temporada</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
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
                            if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
                              return true;
                            }
                            
                            const seasonStart = form.getValues("seasonStart");
                            if (seasonStart && date < seasonStart) {
                              return true;
                            }
                            
                            return false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seasonEnd"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fin de Temporada</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
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
                            if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
                              return true;
                            }
                            
                            const seasonStart = form.getValues("seasonStart");
                            if (seasonStart && date < seasonStart) {
                              return true;
                            }
                            
                            return false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                      El horario estará disponible para programar viajes
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
                disabled={isCreating || isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Guardar Cambios" : "Crear Horario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 