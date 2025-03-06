import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { StepComponentProps } from "./types";
import { useLocations } from "@/hooks/use-locations";
import { useSchedules } from "@/hooks/use-schedules";
import { useBusSeats } from "@/hooks/use-bus-seats";

export function SeatsStep({
  formData,
  updateFormData,
  formatDate,
  formatTime,
  calculateTotalPrice,
}: StepComponentProps) {
  const [expandedPassenger, setExpandedPassenger] = useState<string | null>(
    null
  );

  // Fetch data from API
  const { locations } = useLocations();
  const { schedules } = useSchedules();
  const selectedSchedule = schedules.find(
    (schedule) => schedule.id === formData.scheduleId
  );

  // Fetch bus seats for the selected schedule
  const { seats: busSeats = [], isLoading: isLoadingSeats } = useBusSeats(
    selectedSchedule?.busId
  );

  // Get available seats (not booked in tickets)
  const [availableSeats, setAvailableSeats] = useState<
    { id: string; seatNumber: string }[]
  >([]);

  useEffect(() => {
    // Fetch available seats for the schedule
    const fetchAvailableSeats = async () => {
      if (!selectedSchedule?.id) return;

      try {
        const response = await fetch(
          `/api/schedules/${selectedSchedule.id}/available-seats`
        );
        const data = await response.json();
        setAvailableSeats(data.seats || []);
      } catch (error) {
        console.error("Error fetching available seats:", error);
        setAvailableSeats([]);
      }
    };

    fetchAvailableSeats();
  }, [selectedSchedule?.id]);

  // Combine bus seats with availability information
  const seats = busSeats.map((seat) => {
    const isAvailable = availableSeats.some((s) => s.id === seat.id);
    return {
      ...seat,
      isAvailable,
      status: isAvailable ? "available" : "booked",
    };
  });

  useEffect(() => {
    if (formData.passengers.length > 0 && !expandedPassenger) {
      setExpandedPassenger(formData.passengers[0].seatNumber);
    }
  }, [formData.passengers, expandedPassenger]);

  // Get location names
  const originName = locations.find((l) => l.id === formData.originId)?.name;
  const destinationName = locations.find(
    (l) => l.id === formData.destinationId
  )?.name;

  if (isLoadingSeats) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {originName} - {destinationName}
        </h3>
        <p className="text-sm text-muted-foreground">
          {formatDate(selectedSchedule?.departureDate || new Date())} •{" "}
          {formatTime(selectedSchedule?.departureDate || new Date())}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left side: Seat selection */}
        <div className="md:col-span-2">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              Bus
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {seats.map((seat) => {
              const isSelected = formData.selectedSeats.includes(seat.id);
              const isAvailable = seat.status === "available";

              return (
                <div key={seat.id} className="relative">
                  <button
                    type="button"
                    disabled={!isAvailable}
                    className={cn(
                      "w-full p-3 border rounded-md flex flex-col items-center justify-center transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : isAvailable
                          ? "hover:bg-primary/10"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (isSelected) {
                        // Remove seat and its passenger data
                        updateFormData({
                          selectedSeats: formData.selectedSeats.filter(
                            (id) => id !== seat.id
                          ),
                          passengers: formData.passengers.filter(
                            (p) => p.seatNumber !== seat.seatNumber
                          ),
                        });
                        if (expandedPassenger === seat.seatNumber) {
                          setExpandedPassenger(null);
                        }
                      } else {
                        // Add seat and initialize passenger data
                        const newPassenger = {
                          fullName: "",
                          documentId: "",
                          seatNumber: seat.seatNumber,
                          busSeatId: seat.id,
                        };
                        updateFormData({
                          selectedSeats: [...formData.selectedSeats, seat.id],
                          passengers: [...formData.passengers, newPassenger],
                        });
                        setExpandedPassenger(seat.seatNumber);
                      }
                    }}
                  >
                    <span className="text-lg font-medium">
                      {seat.seatNumber}
                    </span>
                    <span className="text-xs">{seat.tier?.name}</span>
                    <span className="text-xs mt-1">
                      ${seat.tier?.basePrice || 0}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-primary" />
                <span className="text-sm">Seleccionado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border" />
                <span className="text-sm">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-muted" />
                <span className="text-sm">No disponible</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Passenger details and summary */}
        <div>
          <div className="bg-muted p-4 rounded-md mb-4">
            <h4 className="font-medium mb-2">Resumen de selección</h4>
            <p>Asientos seleccionados: {formData.selectedSeats.length}</p>
            <p className="font-medium mt-2">Total: ${calculateTotalPrice()}</p>
          </div>

          <h4 className="font-medium mb-4">Detalles de pasajeros</h4>

          {formData.selectedSeats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 border rounded-md bg-muted/20">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Seleccione asientos para ingresar los datos de los pasajeros
              </p>
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              value={expandedPassenger || undefined}
              onValueChange={(value) => setExpandedPassenger(value)}
            >
              {formData.passengers.map((passenger, index) => (
                <AccordionItem
                  key={passenger.seatNumber}
                  value={passenger.seatNumber}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <span>
                        Pasajero {index + 1} - Asiento {passenger.seatNumber}
                      </span>
                      {passenger.fullName && passenger.documentId && (
                        <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 text-white"
                            aria-hidden="true"
                            title="Datos completos"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor={`fullName-${index}`}>
                          Nombre completo
                        </Label>
                        <Input
                          id={`fullName-${index}`}
                          value={passenger.fullName}
                          onChange={(e) => {
                            const newPassengers = [...formData.passengers];
                            newPassengers[index].fullName = e.target.value;
                            updateFormData({ passengers: newPassengers });
                          }}
                          placeholder="Nombre y apellidos"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`documentId-${index}`}>
                          Documento de identidad
                        </Label>
                        <Input
                          id={`documentId-${index}`}
                          value={passenger.documentId}
                          onChange={(e) => {
                            const newPassengers = [...formData.passengers];
                            newPassengers[index].documentId = e.target.value;
                            updateFormData({ passengers: newPassengers });
                          }}
                          placeholder="Número de documento"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
