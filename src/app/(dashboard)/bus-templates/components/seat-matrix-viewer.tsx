"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SeatTier } from "@/hooks/use-seat-tiers";

interface SeatPosition {
  id: string;
  name: string;
  row: number;
  column: number;
  tierId: string;
  isEmpty: boolean;
  status: string;
}

interface SeatMatrixFloor {
  dimensions: {
    rows: number;
    seatsPerRow: number;
  };
  seats: SeatPosition[];
}

interface SeatTemplateMatrix {
  firstFloor: SeatMatrixFloor;
  secondFloor?: SeatMatrixFloor;
}

interface SeatMatrixViewerProps {
  matrix: SeatTemplateMatrix;
  seatTiers: SeatTier[];
  className?: string;
}

export function SeatMatrixViewer({
  matrix,
  seatTiers,
  className,
}: SeatMatrixViewerProps) {
  const renderSeat = (seat: SeatPosition) => {
    const seatTier = seatTiers.find((tier) => tier.id === seat.tierId);

    return (
      <div
        key={seat.id}
        className={cn(
          "w-12 h-12 flex items-center justify-center rounded-md border text-xs font-medium",
          seat.isEmpty
            ? "bg-gray-100 text-gray-400 border-dashed"
            : seat.tierId
              ? "bg-white border-primary"
              : "bg-red-50 border-red-300"
        )}
        title={seatTier?.name || "Sin tipo asignado"}
      >
        <div className="flex flex-col items-center">
          <span>{seat.name}</span>
          {!seat.isEmpty && seat.tierId && (
            <span className="text-[10px] text-muted-foreground">
              {seatTier?.name.substring(0, 8)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderFloor = (floor: SeatMatrixFloor, floorName: string) => {
    const { seats, dimensions } = floor;
    const { rows } = dimensions;

    // Group seats by row
    const seatsByRow: SeatPosition[][] = [];
    for (let i = 0; i < rows; i++) {
      seatsByRow.push(seats.filter((seat) => seat.row === i));
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{floorName}</h3>

        <div className="space-y-2">
          {seatsByRow.map((rowSeats, rowIndex) => (
            <div 
              key={`row-${rowSeats[0]?.id || `empty-${rowIndex}`}`} 
              className="flex gap-2"
            >
              {rowSeats.map((seat) => renderSeat(seat))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("", className)}>
      <Tabs defaultValue="firstFloor">
        <TabsList className="mb-4">
          <TabsTrigger value="firstFloor">Primer Piso</TabsTrigger>
          {matrix.secondFloor && (
            <TabsTrigger value="secondFloor">Segundo Piso</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="firstFloor">
          {renderFloor(matrix.firstFloor, "Primer Piso")}
        </TabsContent>

        {matrix.secondFloor && (
          <TabsContent value="secondFloor">
            {renderFloor(matrix.secondFloor, "Segundo Piso")}
          </TabsContent>
        )}
      </Tabs>

      <div className="mt-6 space-y-2">
        <h4 className="text-sm font-medium">Leyenda</h4>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-primary rounded-sm" />
            <span className="text-sm">Asiento con tipo asignado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-300 rounded-sm" />
            <span className="text-sm">Asiento sin tipo asignado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-dashed border-gray-300 rounded-sm" />
            <span className="text-sm">Espacio vacío</span>
          </div>
        </div>
      </div>
    </div>
  );
}
