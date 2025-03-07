import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import type { Seat, StepComponentProps } from "./types";
import { useLocations } from "@/hooks/use-locations";
import type { Schedule, ScheduleAvailability } from "@/hooks/use-schedules";
import axios from "axios";

// Extend the ScheduleAvailability type to include debug property
interface ScheduleAvailabilityWithDebug extends ScheduleAvailability {
  debug?: {
    allSeats: Seat[];
    bookedSeatIds: string[];
    busId: string;
  };
}

export function ReviewStep({
  formData,
  formatDate,
  formatTime,
  calculateTotalPrice,
}: StepComponentProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [availabilityData, setAvailabilityData] =
    useState<ScheduleAvailabilityWithDebug | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const { locations } = useLocations();

  // Fetch the selected schedule and its availability
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!formData.scheduleId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch the schedule
        const response = await fetch(`/api/schedules/${formData.scheduleId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch schedule: ${response.statusText}`);
        }

        const data = await response.json();
        setSelectedSchedule(data.schedule);

        // Fetch availability with debug info to get all seats
        const availabilityResponse = await axios.get(
          `/api/schedules/availability?scheduleId=${formData.scheduleId}&debug=true`
        );
        const availability = availabilityResponse.data;

        setAvailabilityData(availability);
      } catch (err) {
        console.error("Error fetching schedule data:", err);
        setError("Error al cargar los datos del viaje");
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduleData();
  }, [formData.scheduleId]);

  // Get all seats (including selected ones that might not be available)
  const allSeats = availabilityData?.debug?.allSeats || [];

  // Find selected seats from all seats
  const selectedSeats = allSeats.filter((seat: Seat) =>
    formData.selectedSeats.includes(seat.id)
  );

  // Get location names
  type LocationWithId = { id: string; name: string; [key: string]: unknown };
  const originName = locations.find(
    (l: LocationWithId) => l.id === formData.originId
  )?.name;
  const destinationName = locations.find(
    (l: LocationWithId) => l.id === formData.destinationId
  )?.name;

  // Show loading state
  if (isLoading) {
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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Revise su compra</h3>

      <div className="space-y-4">
        <div className="p-4 border rounded-md">
          <h4 className="font-medium mb-2">Detalles del viaje</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ruta</p>
              <p className="font-medium">
                {originName} - {destinationName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha y hora</p>
              <p className="font-medium">
                {formatDate(selectedSchedule?.departureDate || new Date())} •{" "}
                {formatTime(selectedSchedule?.departureDate || new Date())}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-md">
          <h4 className="font-medium mb-2">Pasajeros</h4>
          <div className="space-y-3">
            {formData.passengers.map((passenger) => (
              <div
                key={passenger.seatNumber}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{passenger.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    Doc: {passenger.documentId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Asiento {passenger.seatNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-md">
          <h4 className="font-medium mb-2">Resumen de pago</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <p>
                Precio base ({formData.selectedSeats.length}{" "}
                {formData.selectedSeats.length === 1 ? "asiento" : "asientos"})
              </p>
              <p>
                ${selectedSchedule?.price || 0} ×{" "}
                {formData.selectedSeats.length}
              </p>
            </div>
            <div className="flex justify-between">
              <p>Cargos por tipo de asiento</p>
              <p>
                $
                {formData.selectedSeats.reduce((total, seatId) => {
                  const seat = selectedSeats.find((s: Seat) => s.id === seatId);
                  return total + (seat?.tier?.basePrice || 0);
                }, 0)}
              </p>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-medium">
              <p>Total</p>
              <p>${calculateTotalPrice()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
