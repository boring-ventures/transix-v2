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
import type { Schedule, ScheduleAvailability } from "@/hooks/use-schedules";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";

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
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [availabilityData, setAvailabilityData] =
    useState<ScheduleAvailability | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<{
    allSeats: Array<{
      id: string;
      seatNumber: string;
      tierId: string;
      status: string;
      isActive: boolean;
      isBooked: boolean;
      isAvailable: boolean;
      tier?: {
        id: string;
        name: string;
        basePrice: number;
      };
    }>;
    bookedSeatIds: string[];
    busId: string;
  } | null>(null);
  const [showAllSeats, setShowAllSeats] = useState(false);

  // Fetch data from API
  const { locations } = useLocations();
  const { fetchScheduleAvailability } = useSchedules();

  // Fetch the selected schedule and its availability
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!formData.scheduleId) return;

      setIsLoadingSchedule(true);
      setError(null);

      try {
        // Fetch the schedule
        const response = await fetch(`/api/schedules/${formData.scheduleId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch schedule: ${response.statusText}`);
        }

        const data = await response.json();
        setSelectedSchedule(data.schedule);

        // Fetch availability with debug info
        setIsLoadingAvailability(true);

        // Use axios directly to get debug info
        const availabilityResponse = await axios.get(
          `/api/schedules/availability?scheduleId=${formData.scheduleId}&debug=true`
        );
        const availability = availabilityResponse.data;

        setAvailabilityData(availability);

        if (availability.debug) {
          setDebugData(availability.debug);
          console.log("Debug data:", availability.debug);
        }
      } catch (err) {
        console.error("Error fetching schedule data:", err);
        setError("Error al cargar los datos del viaje y asientos disponibles");
      } finally {
        setIsLoadingSchedule(false);
        setIsLoadingAvailability(false);
      }
    };

    fetchScheduleData();
  }, [formData.scheduleId]);

  // Get available seats
  const availableSeats = availabilityData?.availableSeats || [];

  // Get all seats for display
  const allSeats = debugData?.allSeats || [];

  // Determine which seats to display
  const displaySeats = showAllSeats ? allSeats : availableSeats;

  // Combine with selected seats
  const seats = displaySeats.map(
    (seat: {
      id: string;
      seatNumber: string;
      tierId: string;
      status: string;
      isActive: boolean;
      isBooked?: boolean;
      isAvailable?: boolean;
      tier?: {
        id: string;
        name: string;
        basePrice: number;
      };
    }) => ({
      ...seat,
      isSelected: formData.selectedSeats.includes(seat.id),
      isAvailable: seat.isAvailable !== undefined ? seat.isAvailable : true,
    })
  );

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

  // Show loading state
  if (isLoadingSchedule || isLoadingAvailability) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <p className="text-muted-foreground">
          Por favor, intente nuevamente o seleccione otro horario.
        </p>
      </div>
    );
  }

  // Show empty state if no schedule
  if (!selectedSchedule) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          No se encontró el viaje seleccionado.
        </p>
        <p className="text-sm text-muted-foreground">
          Por favor, seleccione otro horario.
        </p>
      </div>
    );
  }

  // Show message if no seats at all
  {
    displaySeats.length === 0 && (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          No hay asientos configurados para este bus.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Por favor, contacte al administrador o cree asientos predeterminados.
        </p>
        {selectedSchedule?.busId && (
          <button
            type="button"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            onClick={async () => {
              try {
                setIsLoadingSchedule(true);
                const response = await axios.post(
                  `/api/buses/${selectedSchedule.busId}/seats/create-default`
                );

                if (response.status === 200) {
                  // Refresh the data
                  const availabilityResponse = await axios.get(
                    `/api/schedules/availability?scheduleId=${formData.scheduleId}&debug=true`
                  );
                  setAvailabilityData(availabilityResponse.data);

                  if (availabilityResponse.data.debug) {
                    setDebugData(availabilityResponse.data.debug);
                  }

                  toast({
                    title: "Éxito",
                    description: "Asientos creados exitosamente",
                  });
                }
              } catch (error) {
                console.error("Error creating seats:", error);
                toast({
                  title: "Error",
                  description: "Error al crear asientos predeterminados",
                  variant: "destructive",
                });
              } finally {
                setIsLoadingSchedule(false);
              }
            }}
          >
            Crear asientos predeterminados
          </button>
        )}
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

      {/* Show toggle for all seats if no available seats */}
      {availableSeats.length === 0 && allSeats.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
          <p className="text-yellow-800 mb-2">
            No hay asientos disponibles para este viaje.
          </p>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-all-seats"
              checked={showAllSeats}
              onChange={() => setShowAllSeats(!showAllSeats)}
              className="mr-2"
            />
            <label htmlFor="show-all-seats" className="text-sm text-yellow-800">
              Mostrar todos los asientos (incluyendo no disponibles)
            </label>
          </div>
        </div>
      )}

      {displaySeats.length > 0 && (
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
                const isAvailable = seat.isAvailable;

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
                        if (!isAvailable) return;

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
                      {!isAvailable && seat.isBooked && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                          Reservado
                        </span>
                      )}
                      {!isAvailable && !seat.isBooked && (
                        <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs px-1 rounded-full">
                          Mantenimiento
                        </span>
                      )}
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
              <p className="font-medium mt-2">
                Total: ${calculateTotalPrice()}
              </p>
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
      )}
    </div>
  );
}
