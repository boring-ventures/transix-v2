"use client";

import { useState, useEffect } from "react";
import { ConditionalUI } from "@/components/auth/ConditionalUI";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface Schedule {
  id: string;
  routeName: string;
  plateNumber: string;
  busType?: string;
  departureTime: string;
  departureDate?: string;
  ownerName: string;
  ticketsSold: number;
  route?: {
    routeName: string;
  };
  driverName?: string;
}

const liquidationFormSchema = z.object({
  scheduleId: z.string().min(1, { message: "Por favor selecciona un viaje" }),
  routeName: z.string().min(1, { message: "La ruta es requerida" }),
  plateNumber: z.string().min(1, { message: "La placa es requerida" }),
  busType: z.string().optional(),
  departureTime: z.date(),
  ownerName: z
    .string()
    .min(1, { message: "El nombre del propietario es requerido" }),

  // Passenger counts
  totalPassengers: z.coerce
    .number()
    .min(0, { message: "El número de pasajeros no puede ser negativo" }),
  fullFarePassengers: z.coerce
    .number()
    .min(0, { message: "El número de pasajeros no puede ser negativo" }),
  discountedPassengers: z.coerce
    .number()
    .min(0, { message: "El número de pasajeros no puede ser negativo" }),
  specialPassengers: z.coerce
    .number()
    .min(0, { message: "El número de pasajeros no puede ser negativo" }),

  // Income amounts
  fullFareAmount: z.coerce
    .number()
    .min(0, { message: "El monto no puede ser negativo" }),
  discountedAmount: z.coerce
    .number()
    .min(0, { message: "El monto no puede ser negativo" }),
  specialAmount: z.coerce
    .number()
    .min(0, { message: "El monto no puede ser negativo" }),
  extraAmount: z.coerce
    .number()
    .min(0, { message: "El monto no puede ser negativo" })
    .optional(),

  // Expenses
  fuelExpense: z.coerce
    .number()
    .min(0, { message: "El monto no puede ser negativo" })
    .optional(),
  tollExpense: z.coerce
    .number()
    .min(0, { message: "El monto no puede ser negativo" })
    .optional(),
  maintenanceExpense: z.coerce
    .number()
    .min(0, { message: "El monto no puede ser negativo" })
    .optional(),
  otherExpense: z.coerce
    .number()
    .min(0, { message: "El monto no puede ser negativo" })
    .optional(),
  otherExpenseDescription: z.string().optional(),

  // Office calculation
  officeFeePercent: z.coerce
    .number()
    .min(0, { message: "El porcentaje no puede ser negativo" })
    .max(100, { message: "El porcentaje no puede ser mayor a 100%" })
    .optional(),

  notes: z.string().optional(),
});

export default function NewLiquidationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableSchedules, setAvailableSchedules] = useState<Schedule[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const router = useRouter();

  // Initialize the form
  const form = useForm<z.infer<typeof liquidationFormSchema>>({
    resolver: zodResolver(liquidationFormSchema),
    defaultValues: {
      scheduleId: "",
      routeName: "",
      plateNumber: "",
      busType: "",
      departureTime: new Date(),
      ownerName: "",
      totalPassengers: 0,
      fullFarePassengers: 0,
      discountedPassengers: 0,
      specialPassengers: 0,
      fullFareAmount: 0,
      discountedAmount: 0,
      specialAmount: 0,
      extraAmount: 0,
      fuelExpense: 0,
      tollExpense: 0,
      maintenanceExpense: 0,
      otherExpense: 0,
      otherExpenseDescription: "",
      officeFeePercent: 0,
      notes: "",
    },
  });

  const { watch, setValue } = form;

  // Calculate derived values
  const fullFarePassengers = watch("fullFarePassengers");
  const discountedPassengers = watch("discountedPassengers");
  const specialPassengers = watch("specialPassengers");

  const fullFareAmount = watch("fullFareAmount");
  const discountedAmount = watch("discountedAmount");
  const specialAmount = watch("specialAmount");
  const extraAmount = watch("extraAmount") || 0;

  const fuelExpense = Number(watch("fuelExpense") || 0);
  const tollExpense = Number(watch("tollExpense") || 0);
  const maintenanceExpense = Number(watch("maintenanceExpense") || 0);
  const otherExpense = Number(watch("otherExpense") || 0);

  const officeFeePercent = watch("officeFeePercent") || 0;

  // Compute totals
  const totalPassengers =
    fullFarePassengers + discountedPassengers + specialPassengers;
  const totalIncome =
    fullFareAmount + discountedAmount + specialAmount + extraAmount;
  const totalExpenses = Number(
    fuelExpense + tollExpense + maintenanceExpense + otherExpense
  );
  const netAmount = totalIncome - totalExpenses;
  const officeFeeAmount = (netAmount * officeFeePercent) / 100;
  const finalAmount = netAmount - officeFeeAmount;

  // Update the form with calculated values
  useEffect(() => {
    setValue("totalPassengers", totalPassengers);
  }, [setValue, totalPassengers]);

  // Load available schedules for liquidation
  useEffect(() => {
    // Fetch schedules without liquidations and expense categories
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch schedules that don't have liquidations yet
        const schedulesResponse = await fetch(
          "/api/finances/schedules?pendingLiquidation=true"
        );

        if (!schedulesResponse.ok) {
          throw new Error("Failed to fetch schedules");
        }

        const schedulesData = await schedulesResponse.json();

        // Map the schedule data to the format expected by the form
        const formattedSchedules = schedulesData.schedules.map(
          (schedule: Schedule) => ({
            id: schedule.id,
            routeName: schedule.route ? schedule.route.routeName : "Sin ruta",
            plateNumber: schedule.plateNumber || "Sin asignar",
            busType: schedule.busType || "Sin asignar",
            departureTime: schedule.departureDate,
            ownerName: schedule.driverName || "Sin asignar",
            ticketsSold: schedule.ticketsSold || 0,
          })
        );

        setAvailableSchedules(formattedSchedules);

        // Ensure we have the required expense categories
        await ensureExpenseCategories();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Function to ensure necessary expense categories exist
  const ensureExpenseCategories = async () => {
    try {
      // Fetch existing categories
      const categoriesResponse = await fetch(
        "/api/finances/expense-categories?active=true"
      );

      let categories = [];
      if (categoriesResponse.ok) {
        categories = await categoriesResponse.json();
      }

      // Check for required categories
      const requiredCategories = [
        { name: "Combustible", description: "Gastos de combustible" },
        { name: "Peajes", description: "Gastos de peajes" },
        { name: "Mantenimiento", description: "Gastos de mantenimiento" },
        { name: "Otros", description: "Otros gastos" },
      ];

      const createdCategories = [];

      // For each required category, check if it exists, if not create it
      for (const required of requiredCategories) {
        const exists = categories.some(
          (cat: any) => cat.name.toLowerCase() === required.name.toLowerCase()
        );

        if (!exists) {
          try {
            const response = await fetch("/api/finances/expense-categories", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...required,
                isActive: true,
              }),
            });

            if (response.ok) {
              const newCategory = await response.json();
              createdCategories.push(newCategory);
            }
          } catch (error) {
            console.error(`Error creating category ${required.name}:`, error);
          }
        }
      }

      // Fetch all categories again to ensure we have the updated list
      const updatedResponse = await fetch(
        "/api/finances/expense-categories?active=true"
      );

      if (updatedResponse.ok) {
        const updatedCategories = await updatedResponse.json();
        setExpenseCategories(updatedCategories);
      } else {
        // If fetch fails, at least include the ones we just created
        setExpenseCategories([...categories, ...createdCategories]);
      }
    } catch (error) {
      console.error("Error ensuring expense categories:", error);
      // Continue with form even if categories couldn't be created
    }
  };

  // Handle schedule selection
  const handleScheduleChange = async (scheduleId: string) => {
    // First, get the selected schedule from the frontend data
    const selectedSchedule = availableSchedules.find(
      (schedule) => schedule.id === scheduleId
    );

    if (selectedSchedule) {
      setValue("routeName", selectedSchedule.routeName);
      setValue("plateNumber", selectedSchedule.plateNumber);
      setValue("busType", selectedSchedule.busType);
      setValue("departureTime", new Date(selectedSchedule.departureTime));
      // Don't set the owner name to leave it for user input
      setValue("ownerName", "");

      // Prefill passenger counts based on tickets sold
      setValue("fullFarePassengers", selectedSchedule.ticketsSold);
      setValue("totalPassengers", selectedSchedule.ticketsSold);

      // Prefill fare amounts based on some assumptions (this would be actual data in a real app)
      if (selectedSchedule.routeName === "CB-POTOSI") {
        setValue("fullFareAmount", 70 * selectedSchedule.ticketsSold);
      } else {
        setValue("fullFareAmount", 50 * selectedSchedule.ticketsSold);
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof liquidationFormSchema>) => {
    try {
      setIsSaving(true);

      // First, create a Trip if it doesn't exist
      let tripId = null;
      try {
        // Check if there's already a Trip for this schedule
        const tripCheckResponse = await fetch(
          `/api/finances/trips?scheduleId=${data.scheduleId}`
        );

        if (tripCheckResponse.ok) {
          const tripData = await tripCheckResponse.json();
          if (tripData && tripData.length > 0) {
            tripId = tripData[0].id;
          }
        }

        // If no trip exists, create one
        if (!tripId) {
          const tripResponse = await fetch("/api/finances/trips", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              scheduleId: data.scheduleId,
              departureTime: data.departureTime,
              status: "completed",
              createdBy: "current-user-id",
            }),
          });

          if (tripResponse.ok) {
            const newTrip = await tripResponse.json();
            tripId = newTrip.id;
          } else {
            console.warn("Failed to create trip, continuing with dummy ID");
            tripId = "dummy-trip-id";
          }
        }
      } catch (tripError) {
        console.error("Error handling trip:", tripError);
        // Continue with a dummy trip ID
        tripId = "dummy-trip-id";
      }

      // Find category IDs from the fetched categories
      const fuelCategoryId =
        expenseCategories.find((cat) =>
          cat.name.toLowerCase().includes("combustible")
        )?.id || "fuel-expense"; // Fallback ID

      const tollCategoryId =
        expenseCategories.find((cat) =>
          cat.name.toLowerCase().includes("peaje")
        )?.id || "toll-expense"; // Fallback ID

      const maintenanceCategoryId =
        expenseCategories.find((cat) =>
          cat.name.toLowerCase().includes("mantenimiento")
        )?.id || "maintenance-expense"; // Fallback ID

      const otherCategoryId =
        expenseCategories.find((cat) => cat.name.toLowerCase().includes("otro"))
          ?.id || "other-expense"; // Fallback ID

      // Create the trip settlement payload
      const settlementPayload = {
        scheduleId: data.scheduleId,
        settledAt: new Date(), // Use settledAt instead of settlementDate
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        netAmount: netAmount,
        // Put notes in the details field since there's no dedicated notes field
        details: `Oficina: ${officeFeePercent}%, Monto Oficina: Bs${officeFeeAmount.toFixed(2)}, Final: Bs${finalAmount.toFixed(2)}${data.notes ? ` | Notas: ${data.notes}` : ""}`,
      };

      // Call the API to create the trip settlement
      const response = await fetch("/api/finances/trip-settlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settlementPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create trip settlement");
      }

      const settlement = await response.json();

      // If we get here, the settlement was created successfully
      // Now, we need to add the expenses
      const expensePromises = [];

      // Only add expenses that have amounts
      if (fuelExpense > 0) {
        expensePromises.push(
          fetch("/api/finances/expenses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tripId: tripId, // Use the actual trip ID we got or created
              categoryId: fuelCategoryId,
              amount: fuelExpense,
              description: "Combustible",
              createdBy: "current-user-id", // This field does exist in TripExpense
              tripSettlementId: settlement.id,
            }),
          })
        );
      }

      if (tollExpense > 0) {
        expensePromises.push(
          fetch("/api/finances/expenses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tripId: tripId, // Use the actual trip ID we got or created
              categoryId: tollCategoryId,
              amount: tollExpense,
              description: "Peajes",
              createdBy: "current-user-id", // This field does exist in TripExpense
              tripSettlementId: settlement.id,
            }),
          })
        );
      }

      if (maintenanceExpense > 0) {
        expensePromises.push(
          fetch("/api/finances/expenses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tripId: tripId, // Use the actual trip ID we got or created
              categoryId: maintenanceCategoryId,
              amount: maintenanceExpense,
              description: "Mantenimiento",
              createdBy: "current-user-id", // This field does exist in TripExpense
              tripSettlementId: settlement.id,
            }),
          })
        );
      }

      if (otherExpense > 0) {
        expensePromises.push(
          fetch("/api/finances/expenses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tripId: tripId, // Use the actual trip ID we got or created
              categoryId: otherCategoryId,
              amount: otherExpense,
              description: data.otherExpenseDescription || "Otros gastos",
              createdBy: "current-user-id", // This field does exist in TripExpense
              tripSettlementId: settlement.id,
            }),
          })
        );
      }

      // Wait for all expense requests to complete
      if (expensePromises.length > 0) {
        await Promise.all(expensePromises);
      }

      // Show success message and redirect
      toast({
        title: "Liquidación creada",
        description: "La liquidación se ha creado exitosamente.",
        variant: "default",
      });

      router.push("/finances/liquidations");
    } catch (error) {
      console.error("Error creating liquidation:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Ha ocurrido un error al crear la liquidación",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ConditionalUI
      allowedRoles={["superadmin", "company_admin", "branch_admin"]}
    >
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Nueva Liquidación
          </h1>
          <p className="text-muted-foreground">
            Registra la liquidación para un viaje completado
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Información del Viaje</CardTitle>
                <CardDescription>
                  Selecciona el viaje para el cual deseas crear la liquidación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="scheduleId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Viaje</FormLabel>
                      <Select
                        disabled={isLoading}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleScheduleChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un viaje" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            availableSchedules.map((schedule) => (
                              <SelectItem key={schedule.id} value={schedule.id}>
                                {schedule.routeName} -{" "}
                                {format(
                                  new Date(schedule.departureTime),
                                  "dd/MM/yyyy HH:mm"
                                )}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="routeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ruta</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="busType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Bus</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="departureTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Salida</FormLabel>
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
                                  format(field.value, "PPP HH:mm")
                                ) : (
                                  <span>Selecciona una fecha</span>
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
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
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
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propietario</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="income" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income">Ingresos</TabsTrigger>
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
              </TabsList>

              <TabsContent value="income">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalle de Ingresos</CardTitle>
                    <CardDescription>
                      Registra los ingresos por tipo de pasaje y otras fuentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Pasajes Enteros</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fullFarePassengers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cantidad</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="fullFareAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Bs</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">
                          Pasajes con Descuento
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="discountedPassengers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cantidad</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="discountedAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Bs</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">
                          Pasajes Especiales
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="specialPassengers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cantidad</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="specialAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Bs</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="extraAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Excesos y Encomiendas (Bs)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Ingresos adicionales por exceso de equipaje y
                              encomiendas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <FormLabel>Total Pasajeros</FormLabel>
                        <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                          {totalPassengers}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cantidad total de pasajeros en este viaje
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center py-2 px-4 bg-muted rounded-lg">
                      <span className="font-medium">Total Ingresos:</span>
                      <span className="text-xl font-bold">
                        Bs {totalIncome.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalle de Gastos</CardTitle>
                    <CardDescription>
                      Registra los gastos realizados durante el viaje
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="fuelExpense"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Combustible (Bs)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tollExpense"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peajes (Bs)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maintenanceExpense"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mantenimiento (Bs)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="otherExpense"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Otros Gastos (Bs)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {otherExpense > 0 && (
                        <FormField
                          control={form.control}
                          name="otherExpenseDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción de Otros Gastos</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Describa los otros gastos"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center py-2 px-4 bg-muted rounded-lg">
                      <span className="font-medium">Total Egresos:</span>
                      <span className="text-xl font-bold">
                        Bs {totalExpenses.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Liquidación Final</CardTitle>
                    <CardDescription>
                      Resultado final de la liquidación
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <FormLabel>Ingresos Totales</FormLabel>
                        <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                          Bs {totalIncome.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <FormLabel>Egresos Totales</FormLabel>
                        <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                          Bs {totalExpenses.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <FormLabel>Saldo (Ingresos - Egresos)</FormLabel>
                        <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted font-medium">
                          Bs {netAmount.toFixed(2)}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="officeFeePercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Porcentaje de Oficina (%)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Monto para Oficina ({officeFeePercent}%):</span>
                        <span>Bs {officeFeeAmount.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center py-2 px-4 bg-muted rounded-lg">
                        <span className="font-medium">Liquidación Total:</span>
                        <span className="text-xl font-bold">
                          Bs {finalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Notas adicionales sobre la liquidación"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => window.history.back()}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isSaving ? "Guardando..." : "Guardar Liquidación"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </ConditionalUI>
  );
}
