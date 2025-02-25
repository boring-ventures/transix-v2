"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SeatTier } from "@/hooks/use-seat-tiers";
import type { BusSeat } from "@/hooks/use-bus-seats";
import type { SeatMatrix, SeatMatrixFloor } from "@/hooks/use-bus-templates";
import type { SeatStatus } from "@prisma/client";

interface MatrixSeat {
  id: string;
  name: string;
  row: number;
  isEmpty: boolean;
  tierId?: string;
}

interface SeatMatrixViewerProps {
  matrix: SeatMatrix;
  seatTiers: SeatTier[];
  seats?: BusSeat[];
  className?: string;
}

export function SeatMatrixViewer({
  matrix,
  seatTiers,
  seats = [],
  className,
}: SeatMatrixViewerProps) {
  const renderSeat = (seat: MatrixSeat) => {
    // Find the corresponding bus seat if it exists
    const busSeat = seats.find(s => s.seatNumber === seat.name);
    
    // Find the seat tier
    const seatTier = seatTiers.find((tier) => 
      busSeat ? tier.id === busSeat.tierId : tier.id === seat.tierId
    );
    
    const seatStatus = (busSeat?.status || "available") as SeatStatus;
    
    return (
      <div
        key={seat.id}
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-sm border text-xs font-medium",
          seat.isEmpty && "bg-gray-100 border-dashed border-gray-300",
          !seat.isEmpty && !seatTier && "bg-red-50 border-red-300 text-red-700",
          !seat.isEmpty && seatTier && "bg-white border-primary text-primary",
          seatStatus === ("reserved" as SeatStatus) && "bg-yellow-100 border-yellow-400 text-yellow-700",
          seatStatus === ("occupied" as SeatStatus) && "bg-red-100 border-red-400 text-red-700",
          seatStatus === ("maintenance" as SeatStatus) && "bg-gray-200 border-gray-500 text-gray-700",
        )}
        title={`${seat.name}${seatTier ? ` - ${seatTier.name}` : ''}`}
      >
        {!seat.isEmpty && seat.name}
      </div>
    );
  };

  const renderFloor = (floor: SeatMatrixFloor, title: string) => {
    const { seats, dimensions } = floor;
    const { rows } = dimensions;
    
    // Group seats by row
    const seatsByRow: MatrixSeat[][] = [];
    for (let i = 0; i < rows; i++) {
      seatsByRow.push(seats.filter((seat: MatrixSeat) => seat.row === i));
    }
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="grid gap-1">
          {seatsByRow.map((rowSeats, rowIndex) => (
            <div key={`row-${rowIndex}-${rowSeats[0]?.id || rowIndex}`} className="flex gap-1">
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
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-400 rounded-sm" />
            <span className="text-sm">Reservado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-400 rounded-sm" />
            <span className="text-sm">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-500 rounded-sm" />
            <span className="text-sm">Mantenimiento</span>
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