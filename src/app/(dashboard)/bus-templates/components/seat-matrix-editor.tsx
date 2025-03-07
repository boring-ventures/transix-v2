"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { SeatTier } from "@/hooks/use-seat-tiers";
import { EditSeatDialog } from "./edit-seat-dialog";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SeatPosition,
  SeatMatrixDimensions,
  SeatTemplateMatrix,
} from "@/hooks/use-bus-templates";

interface SeatMatrixEditorProps {
  value: SeatTemplateMatrix;
  onChange: (value: SeatTemplateMatrix) => void;
  seatTiers: SeatTier[];
  companyId: string;
}

export function SeatMatrixEditor({
  value,
  onChange,
  seatTiers,
}: SeatMatrixEditorProps) {
  const [hasSecondFloor, setHasSecondFloor] = useState(!!value.secondFloor);
  const [selectedSeat, setSelectedSeat] = useState<SeatPosition | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<
    "firstFloor" | "secondFloor"
  >("firstFloor");
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Dimensions state
  const [dimensions, setDimensions] = useState({
    firstFloor: {
      rows: value.firstFloor.dimensions.rows,
      seatsPerRow: value.firstFloor.dimensions.seatsPerRow,
    },
    secondFloor: value.secondFloor
      ? value.secondFloor.dimensions
      : {
          rows: value.firstFloor.dimensions.rows,
          seatsPerRow: value.firstFloor.dimensions.seatsPerRow,
        },
  });

  // Generate seats based on dimensions
  const generateSeats = (
    dimensions: SeatMatrixDimensions,
    existingSeats: SeatPosition[] = [],
    isSecondFloor = false
  ): SeatPosition[] => {
    const seats: SeatPosition[] = [];
    const floorPrefix = isSecondFloor ? "2" : "";
    const floorType = isSecondFloor ? "second" : "first";

    for (let row = 0; row < dimensions.rows; row++) {
      for (let col = 0; col < dimensions.seatsPerRow; col++) {
        const name = `${row + 1}${String.fromCharCode(65 + col)}`;
        const seatId = `${floorPrefix}${name}`;
        const existingSeat = existingSeats.find((s) => s.id === seatId);

        if (existingSeat) {
          // Ensure the floor property is set correctly
          seats.push({
            ...existingSeat,
            floor: floorType,
          });
        } else {
          seats.push({
            id: seatId,
            name: seatId,
            row,
            column: col,
            tierId: "",
            isEmpty: false,
            status: "available",
            floor: floorType,
          });
        }
      }
    }
    return seats;
  };

  // Update dimensions for a floor
  const updateDimensions = (
    floor: "firstFloor" | "secondFloor",
    newDimensions: SeatMatrixDimensions
  ) => {
    // Create a copy of the current matrix
    const updatedMatrix = { ...value };

    // Update the dimensions in the matrix
    if (floor === "firstFloor") {
      updatedMatrix.firstFloor = {
        ...updatedMatrix.firstFloor,
        dimensions: newDimensions,
        seats: generateSeats(
          newDimensions,
          updatedMatrix.firstFloor.seats,
          false
        ),
      };
    } else if (updatedMatrix.secondFloor) {
      updatedMatrix.secondFloor = {
        ...updatedMatrix.secondFloor,
        dimensions: newDimensions,
        seats: generateSeats(
          newDimensions,
          updatedMatrix.secondFloor.seats,
          true
        ),
      };
    }

    // Update the dimensions state
    if (floor === "firstFloor") {
      setDimensions((prev) => ({
        ...prev,
        firstFloor: newDimensions,
      }));
    } else {
      setDimensions((prev) => ({
        ...prev,
        secondFloor: newDimensions,
      }));
    }

    // Call the onChange callback with the updated matrix
    onChange(updatedMatrix);
  };

  // Toggle second floor
  const handleToggleSecondFloor = (checked: boolean) => {
    setHasSecondFloor(checked);
    const updatedMatrix = { ...value };

    if (checked) {
      // Add second floor if it doesn't exist
      updatedMatrix.secondFloor = {
        dimensions: dimensions.secondFloor,
        seats: generateSeats(dimensions.secondFloor, [], true),
      };
    } else if (!checked && updatedMatrix.secondFloor) {
      // Remove second floor if it exists
      delete updatedMatrix.secondFloor;
    }

    onChange(updatedMatrix);
  };

  // Handle seat click
  const handleSeatClick = (
    seat: SeatPosition,
    floor: "firstFloor" | "secondFloor"
  ) => {
    if (isMultiSelectMode) {
      // In multi-select mode, toggle selection
      setSelectedSeats((prev) => {
        const seatKey = `${floor}-${seat.id}`;
        return prev.includes(seatKey)
          ? prev.filter((id) => id !== seatKey)
          : [...prev, seatKey];
      });
    } else {
      // In single-select mode, open edit dialog
      setSelectedSeat(seat);
      setSelectedFloor(floor);
    }
  };

  // Handle seat update
  const handleUpdateSeat = (updatedSeat: SeatPosition) => {
    if (!selectedFloor) return;

    const updatedMatrix = { ...value };
    const floorData = updatedMatrix[selectedFloor];

    if (floorData) {
      // Update the seat in the floor
      const seatIndex = floorData.seats.findIndex(
        (s) => s.id === updatedSeat.id
      );
      if (seatIndex !== -1) {
        floorData.seats[seatIndex] = {
          ...updatedSeat,
          floor: selectedFloor === "firstFloor" ? "first" : "second",
        };
      }
    }

    // Clear selection and notify parent
    setSelectedSeat(null);
    onChange(updatedMatrix);
  };

  // Handle bulk actions on selected seats
  const handleBulkAction = (
    action: "empty" | "fill" | "tier",
    tierId?: string
  ) => {
    if (selectedSeats.length === 0) return;

    const updatedMatrix = { ...value };

    // Process each selected seat
    selectedSeats.forEach((seatKey) => {
      const [floor, seatId] = seatKey.split("-") as [
        "firstFloor" | "secondFloor",
        string,
      ];
      const floorData = updatedMatrix[floor];

      if (floorData) {
        const seatIndex = floorData.seats.findIndex((s) => s.id === seatId);
        if (seatIndex !== -1) {
          if (action === "empty") {
            // Mark seat as empty
            floorData.seats[seatIndex] = {
              ...floorData.seats[seatIndex],
              isEmpty: true,
              tierId: "",
            };
          } else if (action === "fill") {
            // Mark seat as filled
            floorData.seats[seatIndex] = {
              ...floorData.seats[seatIndex],
              isEmpty: false,
            };
          } else if (action === "tier" && tierId) {
            // Assign tier to seat
            floorData.seats[seatIndex] = {
              ...floorData.seats[seatIndex],
              tierId,
              isEmpty: false,
            };
          }
        }
      }
    });

    // Clear selections and notify parent
    setSelectedSeats([]);
    setIsMultiSelectMode(false);
    onChange(updatedMatrix);
  };

  // Handle bulk tier assignment
  const handleBulkAssignTier = (
    floorKey: "firstFloor" | "secondFloor",
    tierId: string
  ) => {
    const updatedMatrix = { ...value };
    const floorData = updatedMatrix[floorKey];

    if (floorData) {
      // Update all non-empty seats in the floor
      floorData.seats = floorData.seats.map((seat) => {
        if (!seat.isEmpty) {
          return {
            ...seat,
            tierId,
            floor: floorKey === "firstFloor" ? "first" : "second",
          };
        }
        return seat;
      });
    }

    onChange(updatedMatrix);
  };

  // Render a single seat
  const renderSeat = (
    seat: SeatPosition,
    floor: "firstFloor" | "secondFloor"
  ) => {
    const seatKey = `${floor}-${seat.id}`;
    const isSelected = selectedSeats.includes(seatKey);
    const tier = seatTiers.find((t) => t.id === seat.tierId);

    // Determine seat color based on tier and state
    let bgColor = "bg-gray-200";
    let textColor = "text-gray-700";

    if (seat.isEmpty) {
      bgColor = "bg-transparent";
      textColor = "text-transparent";
    } else if (tier) {
      // Use tier color if available
      bgColor = `bg-${tier.name.toLowerCase().replace(/\s+/g, "-")}-100`;
      textColor = "text-gray-900";
    }

    if (isSelected) {
      // Highlight selected seats
      bgColor = "bg-primary-200";
      textColor = "text-primary-900";
    }

    return (
      <button
        key={seat.id}
        className={cn(
          "w-12 h-12 rounded-md flex items-center justify-center text-sm font-medium transition-colors",
          bgColor,
          textColor,
          seat.isEmpty
            ? "border border-dashed border-gray-300"
            : "border border-gray-300",
          isSelected ? "ring-2 ring-primary" : ""
        )}
        onClick={() => handleSeatClick(seat, floor)}
      >
        {!seat.isEmpty && seat.name}
      </button>
    );
  };

  // Render a floor
  const renderFloor = (
    floorKey: "firstFloor" | "secondFloor",
    floorName: string
  ) => {
    const floorData = value[floorKey];
    if (!floorData) return null;

    const { dimensions, seats } = floorData;
    const { rows, seatsPerRow } = dimensions;

    // Create a grid of seats
    const grid = [];
    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < seatsPerRow; col++) {
        const seat = seats.find((s) => s.row === row && s.column === col);
        if (seat) {
          rowSeats.push(renderSeat(seat, floorKey));
        }
      }
      grid.push(
        <div key={`${floorKey}-row-${row}`} className="flex gap-2 mb-2">
          {rowSeats}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{floorName}</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor={`${floorKey}-rows`}>Filas:</Label>
              <Input
                id={`${floorKey}-rows`}
                type="number"
                min="1"
                max="20"
                value={dimensions.rows}
                className="w-16"
                onChange={(e) => {
                  const newRows = parseInt(e.target.value) || 1;
                  updateDimensions(floorKey, {
                    ...dimensions,
                    rows: newRows,
                  });
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`${floorKey}-cols`}>Asientos por fila:</Label>
              <Input
                id={`${floorKey}-cols`}
                type="number"
                min="1"
                max="10"
                value={dimensions.seatsPerRow}
                className="w-16"
                onChange={(e) => {
                  const newCols = parseInt(e.target.value) || 1;
                  updateDimensions(floorKey, {
                    ...dimensions,
                    seatsPerRow: newCols,
                  });
                }}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Asignar Tier <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {seatTiers.map((tier) => (
                  <DropdownMenuItem
                    key={tier.id}
                    onClick={() => handleBulkAssignTier(floorKey, tier.id)}
                  >
                    {tier.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-white">{grid}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="multi-select"
            checked={isMultiSelectMode}
            onCheckedChange={(checked) => {
              setIsMultiSelectMode(checked);
              if (!checked) setSelectedSeats([]);
            }}
          />
          <Label htmlFor="multi-select">Selección múltiple</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="second-floor"
            checked={hasSecondFloor}
            onCheckedChange={handleToggleSecondFloor}
          />
          <Label htmlFor="second-floor">Segundo piso</Label>
        </div>
      </div>

      {isMultiSelectMode && selectedSeats.length > 0 && (
        <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
          <span className="text-sm">
            {selectedSeats.length} asiento(s) seleccionado(s)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("empty")}
          >
            Marcar como espacio
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("fill")}
          >
            Marcar como asiento
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Asignar Tier <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {seatTiers.map((tier) => (
                <DropdownMenuItem
                  key={tier.id}
                  onClick={() => handleBulkAction("tier", tier.id)}
                >
                  {tier.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSeats([])}
          >
            Limpiar selección
          </Button>
        </div>
      )}

      <Tabs defaultValue="firstFloor">
        <TabsList className="mb-4">
          <TabsTrigger value="firstFloor">Primer Piso</TabsTrigger>
          {hasSecondFloor && (
            <TabsTrigger value="secondFloor">Segundo Piso</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="firstFloor">
          {renderFloor("firstFloor", "Primer Piso")}
        </TabsContent>
        {hasSecondFloor && (
          <TabsContent value="secondFloor">
            {renderFloor("secondFloor", "Segundo Piso")}
          </TabsContent>
        )}
      </Tabs>

      {selectedSeat && (
        <EditSeatDialog
          open={!!selectedSeat}
          onOpenChange={(open) => {
            if (!open) setSelectedSeat(null);
          }}
          seat={selectedSeat}
          seatTiers={seatTiers}
          onUpdate={handleUpdateSeat}
        />
      )}
    </div>
  );
} 