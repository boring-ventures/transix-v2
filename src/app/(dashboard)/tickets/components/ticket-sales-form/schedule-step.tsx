import { useState, useEffect } from "react";
import { ChevronRight, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { StepComponentProps } from "./types";
import { useLocations } from "@/hooks/use-locations";
import { useSchedules } from "@/hooks/use-schedules";
import type { Schedule } from "@/hooks/use-schedules";
import axios from "axios";

export function ScheduleStep({
  formData,
  updateFormData,
  formatDate,
  formatTime,
}: StepComponentProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableSeatsCount, setAvailableSeatsCount] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const { locations } = useLocations();
  const { searchSchedulesByRoute } = useSchedules();

  // Fetch schedules when origin and destination change
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!formData.originId || !formData.destinationId) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await searchSchedulesByRoute({
          originId: formData.originId,
          destinationId: formData.destinationId,
          status: "scheduled",
          fromDate: new Date().toISOString(),
        });

        console.log("Fetched schedules:", result);
        setSchedules(result || []);

        // Fetch available seats count for each schedule
        if (result && result.length > 0) {
          const seatsCountPromises = result.map(async (schedule: Schedule) => {
            try {
              const response = await axios.get(
                `/api/schedules/availability?scheduleId=${schedule.id}`
              );
              return {
                scheduleId: schedule.id,
                count: response.data.availableSeats?.length || 0,
              };
            } catch (err) {
              console.error(
                `Error fetching seats for schedule ${schedule.id}:`,
                err
              );
              return { scheduleId: schedule.id, count: 0 };
            }
          });

          const seatsCountResults = await Promise.all(seatsCountPromises);
          const seatsCountMap = seatsCountResults.reduce(
            (acc, { scheduleId, count }) => {
              acc[scheduleId] = count;
              return acc;
            },
            {} as Record<string, number>
          );

          setAvailableSeatsCount(seatsCountMap);
        }
      } catch (err) {
        console.error("Error fetching schedules:", err);
        setError("Error al cargar los horarios disponibles");
        setSchedules([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, [formData.originId, formData.destinationId, searchSchedulesByRoute]);

  // Get location names
  interface LocationWithId {
    id: string;
    name: string;
    [key: string]: unknown;
  }

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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {originName} - {destinationName}
      </h3>

      {error && <p className="text-destructive">{error}</p>}

      {schedules.length === 0 ? (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            No hay horarios disponibles para esta ruta.
          </p>
          <p className="text-sm text-muted-foreground">
            Origen: {formData.originId}, Destino: {formData.destinationId}
          </p>
        </div>
      ) : (
        <RadioGroup
          value={formData.scheduleId}
          onValueChange={(value) => updateFormData({ scheduleId: value })}
          className="space-y-3"
        >
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center space-x-2">
              <RadioGroupItem value={schedule.id} id={schedule.id} />
              <Label htmlFor={schedule.id} className="flex-1 cursor-pointer">
                <div className="flex justify-between items-center border rounded-md p-3 hover:bg-muted/50">
                  <div>
                    <p className="font-medium">
                      {formatDate(schedule.departureDate)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatTime(schedule.departureDate)}</span>
                      <ChevronRight className="h-4 w-4" />
                      <span>{formatTime(schedule.estimatedArrivalTime)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${schedule.price}</p>
                    <div className="flex items-center justify-end gap-1 text-sm">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={
                          availableSeatsCount[schedule.id] === 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {availableSeatsCount[schedule.id] || 0} asientos
                        disponibles
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(
                        (new Date(schedule.estimatedArrivalTime).getTime() -
                          new Date(schedule.departureDate).getTime()) /
                          (1000 * 60)
                      )}{" "}
                      min
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
