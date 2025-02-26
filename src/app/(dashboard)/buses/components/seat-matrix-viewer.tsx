"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SeatTier } from "@/hooks/use-seat-tiers";
import { getTierColor } from "@/hooks/use-seat-tiers";
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
    const busSeat = seats.find((s) => s.seatNumber === seat.name);

    // Find the seat tier
    const seatTier = seatTiers.find((tier) =>
      busSeat ? tier.id === busSeat.tierId : tier.id === seat.tierId
    );

    // Use the SeatStatus type properly
    const seatStatus = (busSeat?.status || "available") as SeatStatus;

    // Get tier abbreviation for display (first 2 chars)
    const tierAbbr = seatTier?.name ? seatTier.name.substring(0, 2) : "";
    
    // Get tier color
    const tierIndex = seatTier ? seatTiers.findIndex(t => t.id === seatTier.id) : -1;
    const tierColor = tierIndex >= 0 ? getTierColor(tierIndex, seatTiers.length) : "";
    
    // Custom styles for tier-colored seats
    const customStyle = tierColor && seatStatus === "available" ? { 
      backgroundColor: tierColor,
      borderColor: `hsl(0, 100%, ${Math.max(30, Number.parseInt(tierColor.split('%')[0].split('hsl(0, 100%, ')[1]) - 20)}%)`,
      color: 'white'
    } : {};

    return (
      <div
        key={seat.id}
        className={cn(
          "w-10 h-10 flex flex-col items-center justify-center rounded-sm border text-xs font-medium relative",
          seat.isEmpty && "bg-gray-100 border-dashed border-gray-300",
          !seat.isEmpty && !seatTier && "bg-red-50 border-red-300 text-red-700",
          !seat.isEmpty &&
            seatTier &&
            seatStatus === "available" &&
            !tierColor && "bg-white border-primary text-primary",
          seatStatus === "maintenance" &&
            "bg-gray-200 border-gray-500 text-gray-700"
        )}
        style={customStyle}
        title={`${seat.name}${seatTier ? ` - ${seatTier.name}` : ""} (${seatStatus})`}
      >
        {!seat.isEmpty && (
          <>
            <span className="text-[10px] font-semibold">{tierAbbr}</span>
            <span>{seat.name}</span>
          </>
        )}
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
          {seatTiers.map((tier, index) => (
            <div key={tier.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm" 
                style={{ 
                  backgroundColor: getTierColor(index, seatTiers.length),
                  border: `1px solid ${getTierColor(index, seatTiers.length)}`,
                }}
              />
              <span className="text-sm">{tier.name}</span>
            </div>
          ))}
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