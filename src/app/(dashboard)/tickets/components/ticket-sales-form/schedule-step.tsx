import { ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { StepComponentProps } from "./types";
import { useLocations } from "@/hooks/use-locations";
import { useRoutes } from "@/hooks/use-routes";
import { useSchedules } from "@/hooks/use-schedules";

export function ScheduleStep({
  formData,
  updateFormData,
  formatDate,
  formatTime,
}: StepComponentProps) {
  // Fetch data from API
  const { locations } = useLocations();
  const { routes } = useRoutes();

  // Find the route based on origin and destination
  const selectedRoute = routes.find(
    (route) =>
      route.originId === formData.originId &&
      route.destinationId === formData.destinationId
  );

  // Fetch schedules for the selected route
  const { schedules, isLoading: isLoadingSchedules } = useSchedules({
    routeId: selectedRoute?.id,
    status: "scheduled", // Only show scheduled trips
    fromDate: new Date().toISOString(), // Only future trips
  });

  // Get location names
  const originName = locations.find((l) => l.id === formData.originId)?.name;
  const destinationName = locations.find(
    (l) => l.id === formData.destinationId
  )?.name;

  if (isLoadingSchedules) {
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

      {schedules.length === 0 ? (
        <p className="text-muted-foreground">
          No hay horarios disponibles para esta ruta.
        </p>
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
                    <p className="text-sm text-muted-foreground">
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
