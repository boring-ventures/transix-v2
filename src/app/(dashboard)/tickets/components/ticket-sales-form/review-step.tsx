import { Separator } from "@/components/ui/separator";
import type { StepComponentProps } from "./types";
import { useLocations } from "@/hooks/use-locations";
import { useSchedules } from "@/hooks/use-schedules";
import { useBusSeats } from "@/hooks/use-bus-seats";

export function ReviewStep({
  formData,
  formatDate,
  formatTime,
  calculateTotalPrice,
}: StepComponentProps) {
  // Fetch data from API
  const { locations } = useLocations();
  const { schedules } = useSchedules();
  const selectedSchedule = schedules.find(
    (schedule) => schedule.id === formData.scheduleId
  );

  // Fetch bus seats for the selected schedule
  const { seats: busSeats = [] } = useBusSeats(selectedSchedule?.busId);

  // Get location names
  const originName = locations.find((l) => l.id === formData.originId)?.name;
  const destinationName = locations.find(
    (l) => l.id === formData.destinationId
  )?.name;

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
                  const seat = busSeats.find((s) => s.id === seatId);
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
