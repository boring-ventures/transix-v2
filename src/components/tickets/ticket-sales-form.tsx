"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Step } from "@/components/ui/stepper";
import { RouteSelection } from "./steps/route-selection";
import { ScheduleSelection } from "./steps/schedule-selection";
import { SeatSelection } from "./steps/seat-selection";
import { PassengerDetails } from "./steps/passenger-details";
import { ReviewPayment } from "./steps/review-payment";
import { useAuth } from "@/hooks/use-auth";
import { useBulkTickets } from "@/hooks/use-bulk-tickets";
import { Form } from "@/components/ui/form";

const steps = [
  { id: "route", title: "Ruta", description: "Seleccione origen y destino" },
  { id: "schedule", title: "Horario", description: "Elija fecha y hora" },
  { id: "seats", title: "Asientos", description: "Seleccione asientos" },
  {
    id: "passengers",
    title: "Pasajeros",
    description: "Detalles de pasajeros",
  },
  { id: "review", title: "Revisión", description: "Confirme los detalles" },
];

const formSchema = z.object({
  // Route selection
  originId: z.string().min(1, "Seleccione el origen"),
  destinationId: z.string().min(1, "Seleccione el destino"),

  // Schedule selection
  scheduleId: z.string().min(1, "Seleccione el horario"),

  // Seat selection
  selectedSeats: z
    .array(
      z.object({
        busSeatId: z.string(),
        price: z.number(),
      })
    )
    .min(1, "Seleccione al menos un asiento"),

  // Passenger details
  passengers: z.array(
    z.object({
      fullName: z.string().min(1, "Nombre requerido"),
      documentId: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
});

export type FormData = z.infer<typeof formSchema>;

export function TicketSalesForm() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const { createBulkTickets, isLoading } = useBulkTickets();
  const [canAdvance, setCanAdvance] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedSeats: [],
      passengers: [],
    },
    mode: "onChange",
  });

  // Watch for form changes
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      switch (currentStep) {
        case 0: // Route selection
          setCanAdvance(!!value.originId && !!value.destinationId);
          break;
        case 1: // Schedule selection
          setCanAdvance(!!value.scheduleId);
          break;
        case 2: // Seat selection
          setCanAdvance((value.selectedSeats?.length ?? 0) > 0);
          break;
        case 3: // Passenger details
          setCanAdvance(
            (value.passengers?.length ?? 0) ===
              (value.selectedSeats?.length ?? 0) &&
              (value.passengers?.every((p) => !!p?.fullName) ?? false)
          );
          break;
        case 4: // Review
          setCanAdvance(true);
          break;
        default:
          setCanAdvance(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [currentStep, form]);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCanAdvance(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (currentStep === steps.length - 1) {
        // Only submit on final step
        const tickets = data.selectedSeats.map((seat, index) => ({
          scheduleId: data.scheduleId,
          busSeatId: seat.busSeatId,
          customerId: undefined,
          price: seat.price,
          notes: data.passengers[index]?.notes,
        }));

        const result = await createBulkTickets(tickets, user?.id);
        if (result) {
          router.push("/tickets");
        }
      } else {
        // Otherwise just advance to next step
        handleNext();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="p-6">
          {/* Steps indicator */}
          <div className="mb-8">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <Step
                  key={step.id}
                  title={step.title}
                  description={step.description}
                  isCompleted={index < currentStep}
                  isActive={index === currentStep}
                />
              ))}
            </div>
          </div>

          {/* Current step content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && <RouteSelection form={form} />}
            {currentStep === 1 && <ScheduleSelection form={form} />}
            {currentStep === 2 && <SeatSelection form={form} />}
            {currentStep === 3 && <PassengerDetails form={form} />}
            {currentStep === 4 && <ReviewPayment form={form} />}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
            >
              Atrás
            </Button>

            <div className="text-sm text-muted-foreground">
              Paso {currentStep + 1} de {steps.length}
            </div>

            <Button
              type="submit"
              variant="default"
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading || !canAdvance}
            >
              {currentStep === steps.length - 1
                ? "Completar venta"
                : "Siguiente"}
            </Button>
          </div>
        </Card>
      </form>
    </Form>
  );
}
