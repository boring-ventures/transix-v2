"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { SeatMatrixViewer } from "./seat-matrix-viewer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Bus } from "@/hooks/use-buses";
import type { BusSeat } from "@/hooks/use-bus-seats";
import type { SeatTier } from "@/hooks/use-seat-tiers";
import type { SeatMatrix } from "@/hooks/use-bus-templates";

// Update this interface for the seat in the matrix
interface SeatMatrixSeat {
  id: string;
  name: string;
  row: number;
  isEmpty: boolean;
  position: { x: number; y: number };
  tierId?: string;
}

interface SeatManagementProps {
  bus: Bus;
  seats: BusSeat[];
  seatTiers: SeatTier[];
  onSeatsUpdated: () => void;
}

// Add this wrapper component before the SeatManagement component
function SeatMatrixViewerWrapper({
  matrix,
  seatTiers,
  seats,
  onSeatClick,
}: {
  matrix: SeatMatrix;
  seatTiers: SeatTier[];
  seats: BusSeat[];
  onSeatClick: (seatNumber: string) => void;
}) {
  // Create a modified version of the matrix with click handlers
  const enhancedMatrix = {
    ...matrix,
    firstFloor: {
      ...matrix.firstFloor,
      seats: matrix.firstFloor.seats.map((seat) => ({
        ...seat,
        onClick: () => onSeatClick(seat.name),
      })),
    },
    secondFloor: matrix.secondFloor
      ? {
          ...matrix.secondFloor,
          seats: matrix.secondFloor.seats.map((seat) => ({
            ...seat,
            onClick: () => onSeatClick(seat.name),
          })),
        }
      : undefined,
  };

  return (
    <SeatMatrixViewer
      matrix={enhancedMatrix}
      seatTiers={seatTiers}
      seats={seats}
    />
  );
}

export function SeatManagement({
  bus,
  seats,
  seatTiers,
  onSeatsUpdated,
}: SeatManagementProps) {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedSeat, setEditedSeat] = useState<{
    seatNumber: string;
    tierId: string;
    isActive: boolean;
    isEmpty: boolean;
  } | null>(null);

  // Find the seat in the matrix
  const findSeatInMatrix = (seatNumber: string) => {
    const matrix = bus.seatMatrix;

    // Check first floor
    const firstFloorSeat = matrix.firstFloor.seats.find(
      (seat) => seat.name === seatNumber
    ) as SeatMatrixSeat | undefined;
    if (firstFloorSeat) return { seat: firstFloorSeat, floor: "firstFloor" };

    // Check second floor if it exists
    if (matrix.secondFloor) {
      const secondFloorSeat = matrix.secondFloor.seats.find(
        (seat) => seat.name === seatNumber
      ) as SeatMatrixSeat | undefined;
      if (secondFloorSeat)
        return { seat: secondFloorSeat, floor: "secondFloor" };
    }

    return null;
  };

  // Find the seat in the database
  const findSeatInDatabase = (seatNumber: string) => {
    return seats.find((seat) => seat.seatNumber === seatNumber);
  };

  const handleSeatClick = (seatNumber: string) => {
    setSelectedSeat(seatNumber);

    const seatInMatrix = findSeatInMatrix(seatNumber);
    const seatInDb = findSeatInDatabase(seatNumber);

    if (seatInMatrix) {
      setEditedSeat({
        seatNumber,
        tierId: seatInDb?.tierId || seatTiers[0]?.id || "",
        isActive: seatInDb?.isActive !== false,
        isEmpty: seatInMatrix.seat.isEmpty || false,
      });

      setIsDialogOpen(true);
    }
  };

  const handleSaveSeat = async () => {
    if (!editedSeat) return;

    setIsLoading(true);

    try {
      // Clone the current seat matrix
      const updatedMatrix = JSON.parse(JSON.stringify(bus.seatMatrix));

      // Find the seat in the matrix
      const seatLocation = findSeatInMatrix(editedSeat.seatNumber);
      if (!seatLocation) {
        toast({
          title: "Error",
          description: "No se pudo encontrar el asiento en la matriz",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update the seat in the matrix
      const { seat } = seatLocation;
      seat.isEmpty = editedSeat.isEmpty;

      // Update the matrix in the database
      const matrixResponse = await fetch(`/api/buses/${bus.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatMatrix: updatedMatrix,
        }),
      });

      if (!matrixResponse.ok) {
        throw new Error("Error updating seat matrix");
      }

      // If the seat is not empty, update or create the seat in the database
      if (!editedSeat.isEmpty) {
        // Get all current seats
        const currentSeats = [...seats];

        // Filter out the current seat if it exists
        const filteredSeats = currentSeats.filter(
          (s) => s.seatNumber !== editedSeat.seatNumber
        );

        // Add the updated seat
        filteredSeats.push({
          id: findSeatInDatabase(editedSeat.seatNumber)?.id || "",
          busId: bus.id,
          seatNumber: editedSeat.seatNumber,
          tierId: editedSeat.tierId,
          // Only use available or maintenance as per the schema
          status: editedSeat.isActive ? "available" : "maintenance",
          isActive: editedSeat.isActive,
          tier: undefined,
          createdAt:
            findSeatInDatabase(editedSeat.seatNumber)?.createdAt ||
            new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Update all seats
        const seatsResponse = await fetch(`/api/buses/${bus.id}/seats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            seats: filteredSeats.map((s) => ({
              seatNumber: s.seatNumber,
              tierId: s.tierId,
              // Ensure we only use valid status values from the schema
              status: s.isActive ? "available" : "maintenance",
              isActive: s.isActive,
            })),
          }),
        });

        if (!seatsResponse.ok) {
          throw new Error("Error updating seats");
        }
      }

      toast({
        title: "Éxito",
        description: "Asiento actualizado correctamente",
      });
      onSeatsUpdated();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving seat:", error);
      toast({
        title: "Error",
        description: "Error al guardar el asiento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <SeatMatrixViewerWrapper
        matrix={bus.seatMatrix}
        seatTiers={seatTiers}
        seats={seats}
        onSeatClick={handleSeatClick}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Asiento {selectedSeat}</DialogTitle>
            <DialogDescription>
              Configura las propiedades del asiento seleccionado
            </DialogDescription>
          </DialogHeader>

          {editedSeat && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is-empty">Espacio Vacío</Label>
                <Switch
                  id="is-empty"
                  checked={editedSeat.isEmpty}
                  onCheckedChange={(checked) => {
                    setEditedSeat({
                      ...editedSeat,
                      isEmpty: checked,
                    });
                  }}
                />
              </div>

              {!editedSeat.isEmpty && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tier">Categoría de Asiento</Label>
                    <Select
                      value={editedSeat.tierId}
                      onValueChange={(value) => {
                        setEditedSeat({
                          ...editedSeat,
                          tierId: value,
                        });
                      }}
                      disabled={editedSeat.isEmpty}
                    >
                      <SelectTrigger id="tier">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {seatTiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-active">Asiento Activo</Label>
                    <Switch
                      id="is-active"
                      checked={editedSeat.isActive}
                      onCheckedChange={(checked) => {
                        setEditedSeat({
                          ...editedSeat,
                          isActive: checked,
                        });
                      }}
                      disabled={editedSeat.isEmpty}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSeat} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
