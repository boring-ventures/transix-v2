"use client";

import { useSeatTiers, type SeatTier } from "@/hooks/use-seat-tiers";
import { cn } from "@/lib/utils";
import type { SeatMatrix } from "@/hooks/use-bus-templates";

interface SeatPosition {
  id: string;
  name: string;
  row: number;
  column: number;
  tierId: string;
  isEmpty: boolean;
  status: string;
}

interface SeatMatrixViewerProps {
  seatMatrix: SeatMatrix;
}

export function SeatMatrixViewer({ seatMatrix }: SeatMatrixViewerProps) {
  const { seatTiers } = useSeatTiers();

  if (!seatMatrix || !seatMatrix.firstFloor) {
    return (
      <div className="text-muted-foreground">
        No hay configuración de asientos disponible
      </div>
    );
  }

  const hasSecondFloor = !!seatMatrix.secondFloor;

  const renderSeat = (seat: SeatPosition) => {
    if (seat.isEmpty) {
      return (
        <div
          key={seat.id}
          className="w-12 h-12 border border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400"
        >
          <span className="text-xs">Vacío</span>
        </div>
      );
    }

    const tier = seatTiers?.find((t: SeatTier) => t.id === seat.tierId);

    return (
      <div
        key={seat.id}
        className={cn(
          "w-12 h-12 border rounded-md flex flex-col items-center justify-center",
          tier ? "bg-primary/10 border-primary" : "bg-gray-100 border-gray-300"
        )}
      >
        <span className="text-xs font-medium">{seat.name}</span>
        {tier && (
          <span className="text-[10px] text-primary-foreground bg-primary px-1 rounded mt-1">
            {tier.name}
          </span>
        )}
      </div>
    );
  };

  const renderFloor = (
    floorKey: "firstFloor" | "secondFloor",
    floorName: string
  ) => {
    const floor = seatMatrix[floorKey];
    if (!floor) return null;

    const { seats, dimensions } = floor;
    const { rows } = dimensions;

    // Group seats by row
    const seatsByRow: SeatPosition[][] = [];
    for (let i = 0; i < rows; i++) {
      seatsByRow.push(seats.filter((seat: SeatPosition) => seat.row === i));
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">{floorName}</h3>
        <div className="space-y-2">
          {seatsByRow.map((rowSeats) => (
            <div key={`row-${rowSeats[0]?.row ?? Math.random()}`} className="flex gap-2">
              {rowSeats.map((seat) => renderSeat(seat))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderFloor("firstFloor", "Primer Piso")}
      {hasSecondFloor && renderFloor("secondFloor", "Segundo Piso")}

      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-medium mb-2">Leyenda</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-6 h-6 border border-dashed border-gray-300 rounded-md mr-2" />
            <span className="text-sm">Espacio vacío</span>
          </div>
          {seatTiers?.map((tier: SeatTier) => (
            <div key={tier.id} className="flex items-center">
              <div className="w-6 h-6 bg-primary/10 border border-primary rounded-md mr-2" />
              <span className="text-sm">{tier.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
