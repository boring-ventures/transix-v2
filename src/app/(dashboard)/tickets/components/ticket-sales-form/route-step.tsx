import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StepComponentProps } from "./types";
import { useLocations } from "@/hooks/use-locations";
import type { Location } from "./types";
export function RouteStep({ formData, updateFormData }: StepComponentProps) {
  // Fetch locations from API
  const { locations, isLoadingLocations } = useLocations();

  if (isLoadingLocations) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Filter active locations
  const activeLocations = locations.filter((location: Location) => location.active);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="origin">Origen</Label>
        <Select
          value={formData.originId}
          onValueChange={(value) =>
            updateFormData({
              originId: value,
              destinationId:
                formData.destinationId === value ? "" : formData.destinationId,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione origen" />
          </SelectTrigger>
          <SelectContent>
            {activeLocations.map((location: Location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination">Destino</Label>
        <Select
          value={formData.destinationId}
          onValueChange={(value) => updateFormData({ destinationId: value })}
          disabled={!formData.originId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione destino" />
          </SelectTrigger>
          <SelectContent>
            {activeLocations
              .filter((location: Location) => location.id !== formData.originId)
              .map((location: Location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
