"use client";

import { cn } from "@/lib/utils";

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

interface CompactSeatMatrixProps {
  matrix: SeatTemplateMatrix;
  className?: string;
}

export function CompactSeatMatrix({ matrix, className }: CompactSeatMatrixProps) {
  const renderFloor = (floor: SeatMatrixFloor) => {
    const { seats, dimensions } = floor;
    const { rows } = dimensions;
    
    // Group seats by row
    const seatsByRow: SeatPosition[][] = [];
    for (let i = 0; i < rows; i++) {
      seatsByRow.push(seats.filter(seat => seat.row === i));
    }
    
    return (
      <div className="space-y-0.5">
        {seatsByRow.map((rowSeats, rowIndex) => (
          <div 
            key={`row-${rowSeats[0]?.id || `empty-${rowIndex}`}`} 
            className="flex gap-0.5"
          >
            {rowSeats.map(seat => (
              <div
                key={seat.id}
                className={cn(
                  "w-2 h-2 rounded-sm",
                  seat.isEmpty 
                    ? "bg-gray-200" 
                    : seat.tierId 
                      ? "bg-primary" 
                      : "bg-red-300"
                )}
                title={seat.name}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };
  
  // If there's a second floor, render floors side by side
  if (matrix.secondFloor) {
    return (
      <div className={cn("flex gap-2", className)}>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">1º</span>
          {renderFloor(matrix.firstFloor)}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">2º</span>
          {renderFloor(matrix.secondFloor)}
        </div>
      </div>
    );
  }
  
  // If there's only one floor, render it normally
  return (
    <div className={cn(className)}>
      {renderFloor(matrix.firstFloor)}
    </div>
  );
} 