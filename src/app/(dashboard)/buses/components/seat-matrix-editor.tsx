"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SeatTier } from "@/hooks/use-seat-tiers";
import type { BusSeat } from "@/hooks/use-bus-seats";
import type { SeatMatrix } from "@/hooks/use-bus-templates";
import { cn } from "@/lib/utils";
import type { SeatStatus } from "@prisma/client";

// Define an interface for the seat in the matrix
interface MatrixSeat {
  id: string;
  name: string;
  row: number;
  isEmpty: boolean;
  tierId?: string;
}

// Define an interface for the floor
interface MatrixFloor {
  seats: MatrixSeat[];
  dimensions: {
    rows: number;
    seatsPerRow: number;
  };
}

interface SeatMatrixEditorProps {
  matrix: SeatMatrix;
  seatTiers: SeatTier[];
  seats?: BusSeat[];
  onUpdate: (seats: BusSeat[]) => void;
  isUpdating?: boolean;
}

export function SeatMatrixEditor({
  matrix,
  seatTiers,
  seats = [],
  onUpdate,
  isUpdating = false,
}: SeatMatrixEditorProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("available");

  const handleSeatClick = (seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const handleApplyTier = () => {
    if (!selectedTier || selectedSeats.length === 0) return;

    // Create updated seats array
    const updatedSeats = prepareSeatsForUpdate();

    // Update seats with selected tier
    for (const seatId of selectedSeats) {
      const seat =
        matrix.firstFloor.seats.find((s) => s.id === seatId) ||
        matrix.secondFloor?.seats.find((s) => s.id === seatId);

      if (seat && !seat.isEmpty) {
        const existingSeat = updatedSeats.find(
          (s) => s.seatNumber === seat.name
        );

        if (existingSeat) {
          existingSeat.tierId = selectedTier;
        } else {
          updatedSeats.push({
            seatNumber: seat.name,
            tierId: selectedTier,
            status: selectedStatus as SeatStatus,
            isActive: true,
          });
        }
      }
    }

    // Update seats
    onUpdate(updatedSeats as BusSeat[]);

    // Clear selection
    setSelectedSeats([]);
  };

  const handleApplyStatus = () => {
    if (selectedSeats.length === 0) return;

    // Create updated seats array
    const updatedSeats = prepareSeatsForUpdate();

    // Update seats with selected status
    for (const seatId of selectedSeats) {
      const seat =
        matrix.firstFloor.seats.find((s) => s.id === seatId) ||
        matrix.secondFloor?.seats.find((s) => s.id === seatId);

      if (seat && !seat.isEmpty) {
        const existingSeat = updatedSeats.find(
          (s) => s.seatNumber === seat.name
        );

        if (existingSeat) {
          existingSeat.status = selectedStatus as SeatStatus;
        } else {
          // If no tier is assigned, we can't create a seat
          const seatTier = seats.find(
            (s) => s.seatNumber === seat.name
          )?.tierId;
          if (seatTier) {
            updatedSeats.push({
              seatNumber: seat.name,
              tierId: seatTier,
              status: selectedStatus as SeatStatus,
              isActive: true,
            });
          }
        }
      }
    }

    // Update seats
    onUpdate(updatedSeats as BusSeat[]);

    // Clear selection
    setSelectedSeats([]);
  };

  const prepareSeatsForUpdate = () => {
    // Start with existing seats
    return seats.map((seat) => ({
      seatNumber: seat.seatNumber,
      tierId: seat.tierId,
      status: seat.status,
      isActive: seat.isActive,
    }));
  };

  const renderSeat = (seat: MatrixSeat) => {
    // Find the corresponding bus seat if it exists
    const busSeat = seats.find((s) => s.seatNumber === seat.name);

    // Find the seat tier
    const seatTier = seatTiers.find((tier) =>
      busSeat ? tier.id === busSeat.tierId : tier.id === seat.tierId
    );

    const seatStatus = (busSeat?.status || "available") as SeatStatus;
    const isSelected = selectedSeats.includes(seat.id);

    return (
      <button
        key={seat.id}
        type="button"
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-sm border text-xs font-medium cursor-pointer transition-colors",
          seat.isEmpty &&
            "bg-gray-100 border-dashed border-gray-300 cursor-not-allowed",
          !seat.isEmpty &&
            !seatTier &&
            "bg-red-50 border-red-300 text-red-700 hover:bg-red-100",
          !seat.isEmpty &&
            seatTier &&
            "bg-white border-primary text-primary hover:bg-primary/10",
          seatStatus === ("reserved" as SeatStatus) && "bg-yellow-100 border-yellow-400 text-yellow-700 hover:bg-yellow-200",
          seatStatus === ("occupied" as SeatStatus) && "bg-red-100 border-red-400 text-red-700 hover:bg-red-200",
          seatStatus === ("maintenance" as SeatStatus) && "bg-gray-200 border-gray-500 text-gray-700 hover:bg-gray-300",
          isSelected && "ring-2 ring-offset-1 ring-primary"
        )}
        title={`${seat.name}${seatTier ? ` - ${seatTier.name}` : ""}`}
        onClick={() => !seat.isEmpty && handleSeatClick(seat.id)}
        disabled={seat.isEmpty}
        aria-pressed={isSelected}
      >
        {!seat.isEmpty && seat.name}
      </button>
    );
  };

  const renderFloor = (floor: MatrixFloor, title: string) => {
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
            <div
              key={`row-${rowIndex}-${rowSeats[0]?.id || rowIndex}`}
              className="flex gap-1"
            >
              {rowSeats.map((seat) => renderSeat(seat))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <h3 className="text-sm font-medium mb-2">Tipo de Asiento</h3>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedTier || ""}
            onChange={(e) => setSelectedTier(e.target.value || null)}
          >
            <option value="">Seleccionar tipo</option>
            {seatTiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name} - ${tier.basePrice}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Estado</h3>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="available">Disponible</option>
            <option value="reserved">Reservado</option>
            <option value="occupied">Ocupado</option>
            <option value="maintenance">Mantenimiento</option>
          </select>
        </div>

        <div className="flex flex-col space-y-2 mt-6">
          <Button
            onClick={handleApplyTier}
            disabled={!selectedTier || selectedSeats.length === 0 || isUpdating}
            size="sm"
          >
            Aplicar Tipo
          </Button>
          <Button
            onClick={handleApplyStatus}
            disabled={selectedSeats.length === 0 || isUpdating}
            size="sm"
            variant="outline"
          >
            Aplicar Estado
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          {selectedSeats.length > 0 ? (
            <span>{selectedSeats.length} asientos seleccionados</span>
          ) : (
            <span>Seleccione asientos para editar</span>
          )}
        </div>

        <Button
          onClick={() => setSelectedSeats([])}
          variant="ghost"
          size="sm"
          disabled={selectedSeats.length === 0}
        >
          Limpiar selección
        </Button>
      </div>

      {isUpdating && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Actualizando asientos...</span>
        </div>
      )}

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

      <div className="flex justify-end mt-6">
        <Button
          onClick={() => onUpdate(prepareSeatsForUpdate() as BusSeat[])}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </div>
    </div>
  );
}
