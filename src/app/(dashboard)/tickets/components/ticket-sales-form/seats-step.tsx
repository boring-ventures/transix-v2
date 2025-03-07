import { useState, useEffect, useRef, useCallback } from "react";
import { Users, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StepComponentProps } from "./types";
import { useLocations } from "@/hooks/use-locations";
import type { Schedule, ScheduleAvailability } from "@/hooks/use-schedules";
import { useCustomers } from "@/hooks/use-customers";
import type { Customer } from "@/hooks/use-customers";
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
  const [searchResults, setSearchResults] = useState<
    Record<number, Customer[]>
  >({});
  const [isSearching, setIsSearching] = useState<Record<number, boolean>>({});
  const searchTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});

  // Fetch data from API
  const { locations } = useLocations();

  // Add customer search and creation functionality
  const { fetchCustomers, createCustomer } = useCustomers();

  // Clean up timeouts on unmount
  useEffect(() => {
    // Copy the current ref value to a variable inside the effect
    const timeouts = { ...searchTimeoutRef.current };

    return () => {
      // Use the copied variable in the cleanup function
      Object.values(timeouts).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

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

  // Handle customer search by document ID with debounce
  const handleCustomerSearch = async (
    documentId: string,
    passengerIndex: number
  ) => {
    // Allow searching with just 2 characters for better user experience
    if (!documentId || documentId.length < 2) {
      setSearchResults({ ...searchResults, [passengerIndex]: [] });
      return;
    }

    setIsSearching({ ...isSearching, [passengerIndex]: true });

    try {
      const customers = await fetchCustomers({ documentId });
      console.log(`Search results for "${documentId}":`, customers);
      setSearchResults({ ...searchResults, [passengerIndex]: customers });
    } catch (err) {
      console.error("Error searching for customer:", err);
      toast({
        title: "Error",
        description: "Error al buscar cliente",
        variant: "destructive",
      });
    } finally {
      setIsSearching({ ...isSearching, [passengerIndex]: false });
    }
  };

  // Debounced search function with shorter delay
  const debouncedSearch = (documentId: string, passengerIndex: number) => {
    // Clear any existing timeout for this passenger
    if (searchTimeoutRef.current[passengerIndex]) {
      clearTimeout(searchTimeoutRef.current[passengerIndex]);
    }

    // Set a new timeout with shorter delay (200ms instead of 300ms)
    searchTimeoutRef.current[passengerIndex] = setTimeout(() => {
      handleCustomerSearch(documentId, passengerIndex);
    }, 200); // 200ms debounce time for more responsive search
  };

  // Select a customer from search results
  const selectCustomer = (customer: Customer, passengerIndex: number) => {
    const updatedPassengers = [...formData.passengers];
    updatedPassengers[passengerIndex] = {
      ...updatedPassengers[passengerIndex],
      fullName: customer.fullName,
      customerId: customer.id,
      customer: customer,
      phone: customer.phone || "",
      email: customer.email || "",
    };

    updateFormData({ passengers: updatedPassengers });
    setSearchResults({ ...searchResults, [passengerIndex]: [] });
  };

  // Clear selected customer
  const clearSelectedCustomer = (passengerIndex: number) => {
    const updatedPassengers = [...formData.passengers];
    updatedPassengers[passengerIndex] = {
      ...updatedPassengers[passengerIndex],
      fullName: "",
      customerId: undefined,
      customer: undefined,
      phone: "",
      email: "",
    };

    updateFormData({ passengers: updatedPassengers });
  };

  // Add a function to create customers for all passengers without a customerId
  const createMissingCustomers = useCallback(async () => {
    const passengersWithoutCustomerId = formData.passengers.filter(
      (passenger) =>
        !passenger.customerId && passenger.fullName && passenger.documentId
    );

    if (passengersWithoutCustomerId.length === 0) {
      console.log("No passengers need customer registration");
      return formData.passengers;
    }

    console.log(
      "Creating customers for passengers:",
      passengersWithoutCustomerId
    );

    try {
      const updatedPassengers = [...formData.passengers];

      // Process each passenger sequentially to avoid race conditions
      for (let i = 0; i < passengersWithoutCustomerId.length; i++) {
        const passenger = passengersWithoutCustomerId[i];
        const passengerIndex = formData.passengers.findIndex(
          (p) => p.seatNumber === passenger.seatNumber
        );

        if (passengerIndex === -1) continue;

        try {
          console.log(
            `Creating customer for passenger ${i + 1}/${passengersWithoutCustomerId.length}:`,
            passenger
          );

          // First check if customer already exists with this document ID
          const existingCustomers = await fetchCustomers({
            documentId: passenger.documentId,
          });
          let customer;

          if (existingCustomers && existingCustomers.length > 0) {
            // Use existing customer
            customer = existingCustomers[0];
            console.log("Found existing customer:", customer);
          } else {
            // Create new customer
            customer = await createCustomer({
              fullName: passenger.fullName,
              documentId: passenger.documentId,
              phone: passenger.phone,
              email: passenger.email,
            });
            console.log("Created new customer:", customer);
          }

          if (customer) {
            updatedPassengers[passengerIndex] = {
              ...updatedPassengers[passengerIndex],
              customerId: customer.id,
              customer: customer,
            };
          }
        } catch (err) {
          console.error(`Error processing passenger ${i + 1}:`, err);
        }
      }

      // Update form data with the new passenger information
      updateFormData({ passengers: updatedPassengers });

      const createdCount =
        updatedPassengers.filter((p) => p.customerId).length -
        formData.passengers.filter((p) => p.customerId).length;

      if (createdCount > 0) {
        toast({
          title: "Clientes registrados",
          description: `Se han registrado ${createdCount} nuevos clientes`,
        });
      }

      console.log("Final updated passengers:", updatedPassengers);
      return updatedPassengers;
    } catch (err) {
      console.error("Error creating customers:", err);
      toast({
        title: "Error",
        description: "Error al registrar clientes",
        variant: "destructive",
      });
      return formData.passengers;
    }
  }, [
    formData.passengers,
    fetchCustomers,
    createCustomer,
    updateFormData,
    toast,
  ]);

  // Make the function available to the parent component
  useEffect(() => {
    // Add the function to the window object so it can be called from the parent
    // @ts-expect-error - Adding custom property to window object
    window.createMissingCustomers = createMissingCustomers;

    return () => {
      // Clean up when component unmounts
      // @ts-expect-error - Removing custom property from window object
      delete window.createMissingCustomers;
    };
  }, [createMissingCustomers]); // Add createMissingCustomers as a dependency

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
              ? "bg-transparent border-dashed border-border"
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
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs px-1 rounded-full">
                  Ocupado
                </span>
              )}
              {!isAvailable && !seatInfo.isBooked && (
                <span className="absolute -top-2 -right-2 bg-muted-foreground text-background text-xs px-1 rounded-full">
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

  // Handle document ID change
  const handleDocumentIdChange = (
    documentId: string,
    passengerIndex: number
  ) => {
    const updatedPassengers = [...formData.passengers];
    const currentPassenger = updatedPassengers[passengerIndex];

    // If the passenger already has a customer ID and the document ID is being changed,
    // clear the customer data to allow inputting new details
    if (
      currentPassenger.customerId &&
      currentPassenger.documentId !== documentId
    ) {
      // Clear customer data but keep the new document ID
      updatedPassengers[passengerIndex] = {
        ...updatedPassengers[passengerIndex],
        customerId: undefined,
        customer: undefined,
        documentId: documentId,
      };

      console.log("Cleared customer data due to document ID change");
    } else {
      // Just update the document ID
      updatedPassengers[passengerIndex].documentId = documentId;
    }

    updateFormData({
      passengers: updatedPassengers,
    });

    // Trigger debounced search
    debouncedSearch(documentId, passengerIndex);
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
        <div className="bg-muted/20 border border-border p-4 rounded-md mb-4">
          <p className="text-foreground mb-2">
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
            <label htmlFor="show-all-seats" className="text-sm text-foreground">
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

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-primary" />
                <span className="text-sm">Seleccionado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border border-border" />
                <span className="text-sm">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-muted" />
                <span className="text-sm">No disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border border-dashed border-border" />
                <span className="text-sm">Espacio vacío</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Passenger details and summary */}
        <div className="md:w-full lg:w-[350px] xl:w-[400px] max-w-full">
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
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
              {formData.passengers.map((passenger, index) => (
                <div
                  key={passenger.seatNumber}
                  className="border rounded-lg shadow-sm overflow-hidden"
                >
                  <div
                    className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      if (expandedPassenger === passenger.seatNumber) {
                        setExpandedPassenger(null);
                      } else {
                        setExpandedPassenger(passenger.seatNumber);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <span className="font-medium mr-2 text-primary">
                        Asiento {passenger.seatNumber}
                      </span>
                      {passenger.fullName ? (
                        <span className="text-sm truncate max-w-[150px]">
                          {passenger.fullName}
                        </span>
                      ) : (
                        <span className="text-sm text-destructive">
                          Datos pendientes
                        </span>
                      )}
                    </div>
                    <div
                      className="transform transition-transform duration-200 flex-shrink-0"
                      style={{
                        transform:
                          expandedPassenger === passenger.seatNumber
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                      }}
                    >
                      <svg
                        width="12"
                        height="8"
                        viewBox="0 0 12 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 1.5L6 6.5L11 1.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {expandedPassenger === passenger.seatNumber && (
                    <div className="space-y-4 p-4 bg-card text-card-foreground">
                      {/* Document ID with search */}
                      <div className="space-y-2">
                        <Label
                          htmlFor={`passenger-${index}-document`}
                          className="text-sm font-medium"
                        >
                          Documento de Identidad
                        </Label>
                        <div className="relative">
                          <Input
                            id={`passenger-${index}-document`}
                            value={passenger.documentId || ""}
                            onChange={(e) => {
                              const documentId = e.target.value;
                              handleDocumentIdChange(documentId, index);
                            }}
                            placeholder="Ingrese documento para buscar"
                            className="h-10 text-sm w-full"
                          />
                          {isSearching[index] && (
                            <div className="absolute right-3 top-2">
                              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                          )}

                          {/* Search results dropdown */}
                          {searchResults[index]?.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                              {searchResults[index].map((customer) => (
                                <div
                                  key={customer.id}
                                  className="p-3 hover:bg-muted cursor-pointer flex items-center justify-between border-b border-border last:border-0"
                                  onClick={() =>
                                    selectCustomer(customer, index)
                                  }
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <User className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                    <div className="overflow-hidden">
                                      <p className="font-medium truncate">
                                        {customer.fullName}
                                      </p>
                                      <p className="text-sm text-muted-foreground truncate">
                                        Doc: {customer.documentId}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-primary text-xs whitespace-nowrap ml-2">
                                    Seleccionar
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Show customer info if selected */}
                      {passenger.customerId ? (
                        <div className="bg-primary/5 p-3 rounded-lg space-y-2 border border-primary/20">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-primary text-sm">
                              Información del Cliente
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => clearSelectedCustomer(index)}
                              className="h-7 px-2"
                            >
                              <X className="h-3 w-3 mr-1" /> Limpiar
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Nombre Completo
                              </p>
                              <p className="font-medium text-sm truncate">
                                {passenger.fullName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Documento de Identidad
                              </p>
                              <p className="text-sm">{passenger.documentId}</p>
                            </div>
                            {passenger.phone && (
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Teléfono
                                </p>
                                <p className="text-sm">{passenger.phone}</p>
                              </div>
                            )}
                            {passenger.email && (
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Correo Electrónico
                                </p>
                                <p className="text-sm truncate">
                                  {passenger.email}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Full Name */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`passenger-${index}-name`}
                              className="text-sm font-medium"
                            >
                              Nombre Completo
                            </Label>
                            <Input
                              id={`passenger-${index}-name`}
                              value={passenger.fullName || ""}
                              onChange={(e) => {
                                const updatedPassengers = [
                                  ...formData.passengers,
                                ];
                                updatedPassengers[index].fullName =
                                  e.target.value;
                                updateFormData({
                                  passengers: updatedPassengers,
                                });
                              }}
                              placeholder="Ingrese nombre completo del pasajero"
                              className="h-10 text-sm w-full"
                            />
                          </div>

                          {/* Phone */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`passenger-${index}-phone`}
                              className="text-sm font-medium"
                            >
                              Teléfono (opcional)
                            </Label>
                            <Input
                              id={`passenger-${index}-phone`}
                              value={passenger.phone || ""}
                              onChange={(e) => {
                                const updatedPassengers = [
                                  ...formData.passengers,
                                ];
                                updatedPassengers[index].phone = e.target.value;
                                updateFormData({
                                  passengers: updatedPassengers,
                                });
                              }}
                              placeholder="Número de teléfono"
                              className="h-10 text-sm w-full"
                            />
                          </div>

                          {/* Email */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`passenger-${index}-email`}
                              className="text-sm font-medium"
                            >
                              Correo Electrónico (opcional)
                            </Label>
                            <Input
                              id={`passenger-${index}-email`}
                              value={passenger.email || ""}
                              onChange={(e) => {
                                const updatedPassengers = [
                                  ...formData.passengers,
                                ];
                                updatedPassengers[index].email = e.target.value;
                                updateFormData({
                                  passengers: updatedPassengers,
                                });
                              }}
                              placeholder="Dirección de correo"
                              className="h-10 text-sm w-full"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
