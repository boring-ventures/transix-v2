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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StepComponentProps } from "./types";
import { useLocations } from "@/hooks/use-locations";
import type { Schedule, ScheduleAvailability } from "@/hooks/use-schedules";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";

// Extended seat type that includes all properties used in the component
interface ExtendedSeat {
  id: string;
  seatNumber: string;
  name?: string;
  isEmpty?: boolean;
  isAvailable?: boolean;
  isBooked?: boolean;
  tierId?: string;
  status?: string;
  isActive?: boolean;
  tier?: {
    id: string;
    name: string;
    basePrice: number;
  };
  row?: number;
  column?: number;
}

// Extended availability type that includes seatMatrix
interface ExtendedScheduleAvailability extends ScheduleAvailability {
  seatMatrix?: {
    firstFloor: {
      dimensions: { rows: number; seatsPerRow: number };
      seats: Array<ExtendedSeat>;
    };
    secondFloor?: {
      dimensions: { rows: number; seatsPerRow: number };
      seats: Array<ExtendedSeat>;
    };
  };
}

// Define a location type with id property
interface LocationWithId {
  id: string;
  name: string;
  [key: string]: unknown;
}

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
    useState<ExtendedScheduleAvailability | null>(null);
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
    originalSeatMatrix?: Record<string, unknown>;
  } | null>(null);
  const [showAllSeats, setShowAllSeats] = useState(false);
  // Used for the Tabs component to track which floor is currently active
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeFloor, setActiveFloor] = useState<"firstFloor" | "secondFloor">(
    "firstFloor"
  );

  // Fetch data from API
  const { locations } = useLocations();

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

  // Get seat matrix for structured display
  const seatMatrix = availabilityData?.seatMatrix || {
    firstFloor: { dimensions: { rows: 0, seatsPerRow: 0 }, seats: [] },
    secondFloor: undefined,
  };

  // Determine if bus has a second floor
  const hasSecondFloor = !!seatMatrix.secondFloor;

  // Determine which seats to display
  const displaySeats = showAllSeats ? allSeats : availableSeats;

  // Combine with selected seats
  const seats = (
    displaySeats as Array<{
      id: string;
      seatNumber: string;
      tierId: string;
      status: string;
      isActive: boolean;
      isBooked?: boolean;
      isAvailable?: boolean;
      name?: string;
      tier?: {
        id: string;
        name: string;
        basePrice: number;
      };
    }>
  ).map((seat) => ({
    ...seat,
    isSelected: formData.selectedSeats.includes(seat.id),
    isAvailable: seat.isAvailable !== undefined ? seat.isAvailable : true,
  }));

  useEffect(() => {
    if (formData.passengers.length > 0 && !expandedPassenger) {
      setExpandedPassenger(formData.passengers[0].seatNumber);
    }
  }, [formData.passengers, expandedPassenger]);

  // Get location names
  const originName = locations.find(
    (l: LocationWithId) => l.id === formData.originId
  )?.name;
  const destinationName = locations.find(
    (l: LocationWithId) => l.id === formData.destinationId
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
  if (displaySeats.length === 0) {
    return (
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

  // Render a seat
  const renderSeat = (seat: ExtendedSeat) => {
    if (!seat) return null;

    // Find the seat in our processed seats array to get availability info
    const seatInfo = seats.find((s) => s.id === seat.id) || seat;

    const isSelected = formData.selectedSeats.includes(seat.id);
    const isAvailable = !seat.isEmpty && seatInfo.isAvailable !== false;

    return (
      <div key={seat.id} className="relative">
        <button
          type="button"
          disabled={!isAvailable || seat.isEmpty}
          className={cn(
            "w-full p-3 border rounded-md flex flex-col items-center justify-center transition-colors",
            seat.isEmpty
              ? "bg-transparent border-dashed border-gray-300"
              : isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : isAvailable
                  ? "hover:bg-primary/10"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          onClick={() => {
            if (!isAvailable || seat.isEmpty) return;

            if (isSelected) {
              // Remove seat and its passenger data
              updateFormData({
                selectedSeats: formData.selectedSeats.filter(
                  (id) => id !== seat.id
                ),
                passengers: formData.passengers.filter(
                  (p) => p.seatNumber !== seat.name
                ),
              });
              if (expandedPassenger === seat.name) {
                setExpandedPassenger(null);
              }
            } else {
              // Add seat and initialize passenger data
              console.log("Adding seat:", seat);

              // Log the full seat object to inspect its structure
              console.log("Full seat object:", JSON.stringify(seat, null, 2));

              // In the seat matrix, the seat.id is actually the seat number (e.g., "1A")
              // We need to find the actual seat in allSeats to get the database UUID
              let actualSeatId = seat.id;

              // Check if the ID looks like a seat number
              if (/^[0-9]+[A-Za-z]$/.test(seat.id)) {
                console.log("Seat ID appears to be a seat number:", seat.id);

                // Find the actual seat in allSeats by seat number
                const actualSeat = allSeats.find(
                  (s) => s.seatNumber === seat.id
                );

                if (actualSeat) {
                  console.log("Found actual seat:", actualSeat);
                  actualSeatId = actualSeat.id;
                } else {
                  console.error(
                    "Could not find actual seat with number:",
                    seat.id
                  );

                  // As a fallback, try to find the seat in the processed seats array
                  const processedSeat = seats.find(
                    (s) => s.seatNumber === seat.id
                  );

                  if (processedSeat) {
                    console.log("Found processed seat:", processedSeat);
                    actualSeatId = processedSeat.id;
                  }
                }
              }

              const newPassenger = {
                fullName: "",
                documentId: "",
                seatNumber: seat.name || seat.seatNumber || seat.id, // This is the display name (e.g., "1A")
                busSeatId: actualSeatId, // This should be the database UUID
              };

              console.log("New passenger data:", newPassenger);
              updateFormData({
                selectedSeats: [...formData.selectedSeats, seat.id],
                passengers: [...formData.passengers, newPassenger],
              });
              setExpandedPassenger(seat.name || seat.seatNumber || seat.id);
            }
          }}
        >
          {!seat.isEmpty && (
            <>
              <span className="text-lg font-medium">{seat.name}</span>
              {seatInfo.tier && (
                <>
                  <span className="text-xs">{seatInfo.tier.name}</span>
                  <span className="text-xs mt-1">
                    ${seatInfo.tier.basePrice || 0}
                  </span>
                </>
              )}
              {!isAvailable && seatInfo.isBooked && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                  Reservado
                </span>
              )}
              {!isAvailable && !seatInfo.isBooked && (
                <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs px-1 rounded-full">
                  Mantenimiento
                </span>
              )}
            </>
          )}
        </button>
      </div>
    );
  };

  // Render a floor of seats
  const renderSeatMatrix = (floorKey: "firstFloor" | "secondFloor") => {
    const floor = seatMatrix[floorKey];
    if (
      !floor ||
      !floor.dimensions ||
      !floor.seats ||
      floor.seats.length === 0
    ) {
      return (
        <div className="text-center p-4">
          No hay asientos configurados para este piso.
        </div>
      );
    }

    const { rows, seatsPerRow } = floor.dimensions;

    // Create a 2D grid to place seats in their correct positions
    const grid = Array(rows)
      .fill(null)
      .map(() => Array(seatsPerRow).fill(null));

    // Place seats in the grid
    floor.seats.forEach((seat) => {
      if (
        seat.row !== undefined &&
        seat.row >= 0 &&
        seat.row < rows &&
        seat.column !== undefined &&
        seat.column >= 0 &&
        seat.column < seatsPerRow
      ) {
        grid[seat.row][seat.column] = seat;
      }
    });

    return (
      <div className="space-y-2">
        {grid.map((rowSeats, rowIndex) => (
          <div
            key={`${floorKey}-row-${rowIndex}`}
            className="flex gap-2 justify-center"
          >
            {rowSeats.map((seat, colIndex) => (
              <div key={`${floorKey}-${rowIndex}-${colIndex}`} className="w-16">
                {seat ? renderSeat(seat) : <div className="w-full h-16"></div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left side: Seat selection */}
        <div className="md:col-span-2">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              Bus
            </div>
          </div>

          {hasSecondFloor ? (
            <Tabs
              defaultValue="firstFloor"
              onValueChange={(value) =>
                setActiveFloor(value as "firstFloor" | "secondFloor")
              }
            >
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="firstFloor" className="flex-1">
                  Primer Piso
                </TabsTrigger>
                <TabsTrigger value="secondFloor" className="flex-1">
                  Segundo Piso
                </TabsTrigger>
              </TabsList>
              <TabsContent value="firstFloor">
                {renderSeatMatrix("firstFloor")}
              </TabsContent>
              <TabsContent value="secondFloor">
                {renderSeatMatrix("secondFloor")}
              </TabsContent>
            </Tabs>
          ) : (
            renderSeatMatrix("firstFloor")
          )}

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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border border-dashed border-gray-300" />
                <span className="text-sm">Espacio vacío</span>
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
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">
                        Asiento {passenger.seatNumber}
                      </span>
                      {passenger.fullName ? (
                        <span className="text-sm text-muted-foreground">
                          {passenger.fullName}
                        </span>
                      ) : (
                        <span className="text-sm text-red-500">
                          Datos pendientes
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`fullName-${index}`}>
                          Nombre completo
                        </Label>
                        <Input
                          id={`fullName-${index}`}
                          value={passenger.fullName}
                          onChange={(e) => {
                            const updatedPassengers = [...formData.passengers];
                            updatedPassengers[index].fullName = e.target.value;
                            updateFormData({
                              passengers: updatedPassengers,
                            });
                          }}
                          placeholder="Nombre completo del pasajero"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`documentId-${index}`}>
                          Número de documento
                        </Label>
                        <Input
                          id={`documentId-${index}`}
                          value={passenger.documentId}
                          onChange={(e) => {
                            const updatedPassengers = [...formData.passengers];
                            updatedPassengers[index].documentId =
                              e.target.value;
                            updateFormData({
                              passengers: updatedPassengers,
                            });
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
