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

interface SeatPosition {
  id: string;
  name: string;
  row: number;
  column: number;
  tierId: string;
  isEmpty: boolean;
  status: string;
}

interface SeatMatrixDimensions {
  rows: number;
  seatsPerRow: number;
}

interface SeatMatrixFloor {
  dimensions: SeatMatrixDimensions;
  seats: SeatPosition[];
}

interface SeatTemplateMatrix {
  firstFloor: SeatMatrixFloor;
  secondFloor?: SeatMatrixFloor;
}

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
  const [selectedFloor, setSelectedFloor] = useState<"firstFloor" | "secondFloor">("firstFloor");
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // Dimensions state
  const [firstFloorDimensions, setFirstFloorDimensions] = useState({
    rows: value.firstFloor.dimensions.rows,
    seatsPerRow: value.firstFloor.dimensions.seatsPerRow,
  });
  
  const [secondFloorDimensions, setSecondFloorDimensions] = useState(
    value.secondFloor
      ? value.secondFloor.dimensions
      : { rows: value.firstFloor.dimensions.rows, seatsPerRow: value.firstFloor.dimensions.seatsPerRow }
  );
  
  // Generate seats based on dimensions
  const generateSeats = (
    dimensions: SeatMatrixDimensions,
    existingSeats: SeatPosition[] = [],
    isSecondFloor = false
  ): SeatPosition[] => {
    const seats: SeatPosition[] = [];
    for (let row = 0; row < dimensions.rows; row++) {
      for (let col = 0; col < dimensions.seatsPerRow; col++) {
        const name = `${row + 1}${String.fromCharCode(65 + col)}`;
        const seatId = isSecondFloor ? `2${name}` : name;
        const existingSeat = existingSeats.find((s) => s.id === seatId);
        
        if (existingSeat) {
          seats.push(existingSeat);
        } else {
          seats.push({
            id: seatId,
            name: isSecondFloor ? `2${name}` : name,
            row,
            column: col,
            tierId: "",
            isEmpty: false,
            status: "available",
          });
        }
      }
    }
    return seats;
  };
  
  // Update dimensions
  const updateDimensions = (
    floor: "firstFloor" | "secondFloor",
    newDimensions: SeatMatrixDimensions
  ) => {
    const currentMatrix = { ...value };
    const currentFloor = currentMatrix[floor];
    
    if (floor === "firstFloor") {
      setFirstFloorDimensions(newDimensions);
    } else {
      setSecondFloorDimensions(newDimensions);
    }
    
    const newSeats = generateSeats(
      newDimensions,
      currentFloor?.seats || [],
      floor === "secondFloor"
    );
    
    const updatedMatrix = {
      ...currentMatrix,
      [floor]: {
        dimensions: newDimensions,
        seats: newSeats,
      },
    };
    
    onChange(updatedMatrix);
  };
  
  // Toggle second floor
  const handleToggleSecondFloor = (checked: boolean) => {
    setHasSecondFloor(checked);
    
    const updatedMatrix = { ...value };
    
    if (checked && !updatedMatrix.secondFloor) {
      updatedMatrix.secondFloor = {
        dimensions: secondFloorDimensions,
        seats: generateSeats(secondFloorDimensions, [], true),
      };
    } else if (!checked && updatedMatrix.secondFloor) {
      // Remove the second floor completely
      delete updatedMatrix.secondFloor;
    }
    
    onChange(updatedMatrix);
  };
  
  // Handle seat click
  const handleSeatClick = (seat: SeatPosition, floor: "firstFloor" | "secondFloor") => {
    if (isMultiSelectMode) {
      setSelectedSeats(prev => 
        prev.includes(seat.id)
          ? prev.filter(id => id !== seat.id)
          : [...prev, seat.id]
      );
      return;
    }
    
    setSelectedSeat(seat);
    setSelectedFloor(floor);
  };
  
  // Update seat
  const handleUpdateSeat = (updatedSeat: SeatPosition) => {
    const currentMatrix = { ...value };
    const currentFloor = currentMatrix[selectedFloor];
    
    if (!currentFloor) return;
    
    const seatIndex = currentFloor.seats.findIndex(s => s.id === updatedSeat.id);
    
    if (seatIndex === -1) return;
    
    const updatedSeats = [...currentFloor.seats];
    updatedSeats[seatIndex] = updatedSeat;
    
    const updatedMatrix = {
      ...currentMatrix,
      [selectedFloor]: {
        ...currentFloor,
        seats: updatedSeats,
      },
    };
    
    onChange(updatedMatrix);
    setSelectedSeat(null);
  };
  
  // Bulk actions
  const handleBulkAction = (action: "empty" | "fill" | "tier", tierId?: string) => {
    if (selectedSeats.length === 0) return;
    
    const currentMatrix = { ...value };
    const updatedMatrix = { ...currentMatrix };
    
    // Update first floor seats
    if (updatedMatrix.firstFloor) {
      updatedMatrix.firstFloor = {
        ...updatedMatrix.firstFloor,
        seats: updatedMatrix.firstFloor.seats.map(seat => {
          if (!selectedSeats.includes(seat.id)) return seat;
          
          switch (action) {
            case "empty":
              return { ...seat, isEmpty: true, tierId: "" };
            case "fill":
              return { ...seat, isEmpty: false };
            case "tier":
              return { ...seat, isEmpty: false, tierId: tierId || "" };
            default:
              return seat;
          }
        }),
      };
    }
    
    // Update second floor seats
    if (updatedMatrix.secondFloor) {
      updatedMatrix.secondFloor = {
        ...updatedMatrix.secondFloor,
        seats: updatedMatrix.secondFloor.seats.map(seat => {
          if (!selectedSeats.includes(seat.id)) return seat;
          
          switch (action) {
            case "empty":
              return { ...seat, isEmpty: true, tierId: "" };
            case "fill":
              return { ...seat, isEmpty: false };
            case "tier":
              return { ...seat, isEmpty: false, tierId: tierId || "" };
            default:
              return seat;
          }
        }),
      };
    }
    
    onChange(updatedMatrix);
    setSelectedSeats([]);
  };
  
  // Add this function to handle bulk assignment of seat tiers
  const handleBulkAssignTier = (floorKey: "firstFloor" | "secondFloor", tierId: string) => {
    const currentMatrix = { ...value };
    const currentFloor = currentMatrix[floorKey];
    
    if (!currentFloor) return;
    
    // Update all non-empty seats with the selected tier
    const updatedSeats = currentFloor.seats.map(seat => 
      seat.isEmpty ? seat : { ...seat, tierId }
    );
    
    const updatedMatrix = {
      ...currentMatrix,
      [floorKey]: {
        ...currentFloor,
        seats: updatedSeats,
      },
    };
    
    onChange(updatedMatrix);
  };
  
  // Render a seat
  const renderSeat = (seat: SeatPosition, floor: "firstFloor" | "secondFloor") => {
    const tier = seatTiers.find(t => t.id === seat.tierId);
    const isSelected = selectedSeats.includes(seat.id);
    
    return (
      <button
        key={seat.id}
        type="button"
        className={cn(
          "w-12 h-12 border rounded-md flex flex-col items-center justify-center cursor-pointer transition-all",
          seat.isEmpty 
            ? "border-dashed border-gray-300 bg-gray-50" 
            : tier 
              ? "bg-primary/10 border-primary" 
              : "bg-gray-100 border-gray-300",
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={() => handleSeatClick(seat, floor)}
        aria-label={`Seat ${seat.name}`}
      >
        <span className="text-xs font-medium">{seat.name}</span>
        {tier && !seat.isEmpty && (
          <span className="text-[10px] text-primary-foreground bg-primary px-1 rounded mt-1">
            {tier.name}
          </span>
        )}
      </button>
    );
  };
  
  // Render a floor
  const renderFloor = (floorKey: "firstFloor" | "secondFloor", floorName: string) => {
    const floor = value[floorKey];
    if (!floor) return null;
    
    const { seats, dimensions } = floor;
    const { rows, } = dimensions;
    
    // Group seats by row
    const seatsByRow: SeatPosition[][] = [];
    for (let i = 0; i < rows; i++) {
      seatsByRow.push(seats.filter(seat => seat.row === i));
    }
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{floorName}</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Label htmlFor={`${floorKey}-rows`}>Filas:</Label>
            <Input
              id={`${floorKey}-rows`}
              type="number"
              min={1}
              max={20}
              value={floorKey === "firstFloor" ? firstFloorDimensions.rows : secondFloorDimensions.rows}
              onChange={(e) => {
                const newValue = Number.parseInt(e.target.value) || 1;
                if (floorKey === "firstFloor") {
                  updateDimensions(floorKey, { ...firstFloorDimensions, rows: newValue });
                } else {
                  updateDimensions(floorKey, { ...secondFloorDimensions, rows: newValue });
                }
              }}
              className="w-20"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor={`${floorKey}-cols`}>Asientos por fila:</Label>
            <Input
              id={`${floorKey}-cols`}
              type="number"
              min={1}
              max={10}
              value={floorKey === "firstFloor" ? firstFloorDimensions.seatsPerRow : secondFloorDimensions.seatsPerRow}
              onChange={(e) => {
                const newValue = Number.parseInt(e.target.value) || 1;
                if (floorKey === "firstFloor") {
                  updateDimensions(floorKey, { ...firstFloorDimensions, seatsPerRow: newValue });
                } else {
                  updateDimensions(floorKey, { ...secondFloorDimensions, seatsPerRow: newValue });
                }
              }}
              className="w-20"
            />
          </div>
          
          
        </div>
        <div className="py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Asignar Tipo a Todos <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {seatTiers.map(tier => (
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
        
        <div className="space-y-2">
          {seatsByRow.map((rowSeats) => (
            <div key={`row-${rowSeats[0]?.row ?? Math.random()}`} className="flex gap-2">
              {rowSeats.map(seat => renderSeat(seat, floorKey))}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="has-second-floor">Bus de dos pisos</Label>
            <Switch
              id="has-second-floor"
              checked={hasSecondFloor}
              onCheckedChange={handleToggleSecondFloor}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="multi-select">Selección múltiple</Label>
            <Switch
              id="multi-select"
              checked={isMultiSelectMode}
              onCheckedChange={(checked) => {
                setIsMultiSelectMode(checked);
                if (!checked) setSelectedSeats([]);
              }}
            />
          </div>
        </div>
        
        {isMultiSelectMode && selectedSeats.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedSeats.length} asientos seleccionados
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Acciones <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkAction("empty")}>
                  Marcar como espacio vacío
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("fill")}>
                  Marcar como asiento
                </DropdownMenuItem>
                {seatTiers.map(tier => (
                  <DropdownMenuItem
                    key={tier.id}
                    onClick={() => handleBulkAction("tier", tier.id)}
                  >
                    Asignar tipo: {tier.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
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
          onOpenChange={() => setSelectedSeat(null)}
          seat={selectedSeat}
          seatTiers={seatTiers}
          onUpdate={handleUpdateSeat}
        />
      )}
    </div>
  );
} 