"use client";

import { useState } from "react";
import { MapPin, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { FormData, Schedule, Step } from "./types";
import { StepIndicator } from "./step-indicator";
import { RouteStep } from "./route-step";
import { ScheduleStep } from "./schedule-step";
import { SeatsStep } from "./seats-step";
import { ReviewStep } from "./review-step";
import { useLocations } from "@/hooks/use-locations";
import { useSchedules } from "@/hooks/use-schedules";
import { useBulkTickets } from "@/hooks/use-bulk-tickets";

export default function TicketSalesForm() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("route");
  const [formData, setFormData] = useState<FormData>({
    originId: "",
    destinationId: "",
    scheduleId: "",
    selectedSeats: [],
    passengers: [],
  });

  // Fetch data using hooks
  const { isLoadingLocations } = useLocations();

  // We'll get the schedules from the ScheduleStep component
  // so we don't need to fetch them here

  // Get selected schedule from the scheduleId
  const { schedules } = useSchedules({
    status: "scheduled",
  });

  // Get selected schedule
  const selectedSchedule = schedules.find(
    (schedule: Schedule) => schedule.id === formData.scheduleId
  );

  // Use bulk tickets hook for submission
  const { createBulkTickets, isLoading: isCreatingTickets } = useBulkTickets();

  // Handle form data changes
  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Handle next step
  const goToNextStep = async () => {
    switch (currentStep) {
      case "route":
        setCurrentStep("schedule");
        break;
      case "schedule":
        setCurrentStep("seats");
        break;
      case "seats":
        setCurrentStep("review");
        break;
      case "review":
        // Submit form to create tickets
        try {
          if (!selectedSchedule) {
            toast({
              title: "Error",
              description: "No se ha seleccionado un horario",
              variant: "destructive",
            });
            return;
          }

          // Register any unregistered customers before creating tickets
          let updatedPassengers = [...formData.passengers];
          try {
            console.log("Attempting to register missing customers...");
            // Access the function from the window object in a way that avoids TypeScript errors
            const windowWithCustomFn = window as Window & {
              createMissingCustomers?: () => Promise<
                typeof formData.passengers
              >;
            };

            if (
              typeof windowWithCustomFn.createMissingCustomers === "function"
            ) {
              console.log(
                "createMissingCustomers function found, calling it..."
              );
              const result = await windowWithCustomFn.createMissingCustomers();
              if (Array.isArray(result)) {
                console.log(
                  "Customer registration successful, got updated passengers:",
                  result
                );
                updatedPassengers = result;

                // Update the form data with the latest passenger information
                setFormData((prev) => ({
                  ...prev,
                  passengers: updatedPassengers,
                }));
              }
            } else {
              console.warn(
                "createMissingCustomers function not found on window object"
              );
            }
          } catch (error) {
            console.error("Error registering customers:", error);
            // Continue with ticket creation even if customer registration fails
          }

          // Debug log to check passenger data
          console.log(
            "Final passenger data for ticket creation:",
            updatedPassengers
          );

          // Filter out passengers with undefined busSeatId
          const validPassengers = updatedPassengers.filter(
            (passenger) => passenger.busSeatId !== undefined
          );

          // Check if any passengers are missing customer IDs
          const passengersWithoutCustomerId = validPassengers.filter(
            (passenger) =>
              !passenger.customerId &&
              passenger.fullName &&
              passenger.documentId
          );

          if (passengersWithoutCustomerId.length > 0) {
            console.warn(
              "Some passengers still don't have customer IDs:",
              passengersWithoutCustomerId
            );
            toast({
              title: "Advertencia",
              description:
                "Algunos pasajeros no pudieron ser registrados como clientes",
              variant: "destructive",
            });
          }

          const tickets = validPassengers.map((passenger) => ({
            scheduleId: formData.scheduleId,
            busSeatId: passenger.busSeatId as string,
            customerId: passenger.customerId, // Include customer ID if available
            price: selectedSchedule.price,
            notes: `Pasajero: ${passenger.fullName}, Documento: ${passenger.documentId}`,
            passengerName: passenger.fullName,
            passengerDocument: passenger.documentId,
            contactPhone: passenger.phone,
            contactEmail: passenger.email,
          }));

          // Debug log to check ticket data being sent
          console.log("Sending tickets:", tickets);

          await createBulkTickets(tickets);

          toast({
            title: "Compra completada",
            description: "Los boletos han sido comprados exitosamente",
          });

          // Reset form
          setFormData({
            originId: "",
            destinationId: "",
            scheduleId: "",
            selectedSeats: [],
            passengers: [],
          });
          setCurrentStep("route");
        } catch (err) {
          console.error("Error creating tickets:", err);
          toast({
            title: "Error",
            description: "Ha ocurrido un error al procesar la compra",
            variant: "destructive",
          });
        }
        break;
    }
  };

  // Handle previous step
  const goToPreviousStep = () => {
    switch (currentStep) {
      case "schedule":
        setCurrentStep("route");
        break;
      case "seats":
        setCurrentStep("schedule");
        break;
      case "review":
        setCurrentStep("seats");
        break;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case "route":
        return formData.originId && formData.destinationId;
      case "schedule":
        return formData.scheduleId;
      case "seats":
        return (
          formData.selectedSeats.length > 0 &&
          formData.passengers
            .filter((p) => p.seatNumber)
            .every((p) => p.fullName && p.documentId)
        );
      case "review":
        return true;
    }
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("es", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  // Format time for display
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("es", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedSchedule) return 0;

    // Base price is the schedule price times the number of passengers
    const basePrice = selectedSchedule.price * formData.selectedSeats.length;

    // We don't have access to seat tier prices here, so we'll just use the base price
    // The actual seat tier prices will be calculated in the seats-step and review-step components

    return basePrice;
  };

  const navigateToStep = (step: Step) => {
    // Check if we can navigate to the selected step
    if (
      step === "route" ||
      (step === "schedule" && formData.originId && formData.destinationId) ||
      (step === "seats" && formData.scheduleId) ||
      (step === "review" &&
        formData.selectedSeats.length > 0 &&
        formData.passengers
          .filter((p) => p.seatNumber)
          .every((p) => p.fullName && p.documentId))
    ) {
      setCurrentStep(step);
    }
  };

  // Common props for step components
  const stepProps = {
    formData,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    formatDate,
    formatTime,
    calculateTotalPrice,
  };

  // Show loading state
  if (isLoadingLocations && currentStep === "route") {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Steps indicator */}
      <div className="flex justify-between items-center mb-8">
        <StepIndicator
          label="Ruta"
          description="Seleccione origen y destino"
          icon={<MapPin className="h-5 w-5" />}
          active={currentStep === "route"}
          completed={
            !!(
              currentStep !== "route" &&
              formData.originId &&
              formData.destinationId
            )
          }
          onClick={() => navigateToStep("route")}
        />
        <div className="h-px w-full max-w-12 bg-gray-200" />
        <StepIndicator
          label="Horario"
          description="Elija fecha y hora"
          icon={<Clock className="h-5 w-5" />}
          active={currentStep === "schedule"}
          completed={
            !!(
              currentStep !== "route" &&
              currentStep !== "schedule" &&
              formData.scheduleId
            )
          }
          onClick={() => navigateToStep("schedule")}
        />
        <div className="h-px w-full max-w-12 bg-gray-200" />
        <StepIndicator
          label="Asientos y Pasajeros"
          description="Seleccione asientos y detalles"
          icon={<Users className="h-5 w-5" />}
          active={currentStep === "seats"}
          completed={
            currentStep === "review" && formData.selectedSeats.length > 0
          }
          onClick={() => navigateToStep("seats")}
        />
        <div className="h-px w-full max-w-12 bg-gray-200" />
        <StepIndicator
          label="Revisión"
          description="Confirme los detalles"
          icon="R"
          active={currentStep === "review"}
          completed={false}
          onClick={() => navigateToStep("review")}
        />
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          {/* Render the appropriate step component based on currentStep */}
          {currentStep === "route" && <RouteStep {...stepProps} />}
          {currentStep === "schedule" && <ScheduleStep {...stepProps} />}
          {currentStep === "seats" && <SeatsStep {...stepProps} />}
          {currentStep === "review" && <ReviewStep {...stepProps} />}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === "route"}
        >
          Atrás
        </Button>

        {/* Step counter */}
        <div className="text-center text-sm text-muted-foreground">
          Paso{" "}
          {currentStep === "route"
            ? "1"
            : currentStep === "schedule"
              ? "2"
              : currentStep === "seats"
                ? "3"
                : "4"}{" "}
          de 4
        </div>

        <Button
          onClick={goToNextStep}
          disabled={!isStepValid() || isCreatingTickets}
          className={isCreatingTickets ? "opacity-80" : ""}
        >
          {isCreatingTickets && (
            <div className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          )}
          {currentStep === "review" ? "Confirmar compra" : "Siguiente"}
        </Button>
      </div>
    </div>
  );
}
