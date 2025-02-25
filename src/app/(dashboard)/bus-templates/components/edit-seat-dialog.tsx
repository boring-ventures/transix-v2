"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

interface EditSeatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seat: SeatPosition;
  seatTiers: SeatTier[];
  onUpdate: (updatedSeat: SeatPosition) => void;
}

export function EditSeatDialog({
  open,
  onOpenChange,
  seat,
  seatTiers,
  onUpdate,
}: EditSeatDialogProps) {
  const [isEmpty, setIsEmpty] = useState(seat.isEmpty);
  const [tierId, setTierId] = useState(seat.tierId);
  const [name, setName] = useState(seat.name);
  
  const handleSave = () => {
    onUpdate({
      ...seat,
      isEmpty,
      tierId: isEmpty ? "" : tierId,
      name,
    });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Asiento {seat.name}</DialogTitle>
          <DialogDescription>
            Configure las propiedades del asiento
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex flex-col space-y-3">
            <Label htmlFor="seat-type" className="text-base font-medium">Tipo de Espacio</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={!isEmpty ? "default" : "outline"}
                className={!isEmpty ? "bg-primary" : ""}
                onClick={() => {
                  setIsEmpty(false);
                }}
              >
                Asiento
              </Button>
              <Button
                type="button"
                variant={isEmpty ? "default" : "outline"}
                className={isEmpty ? "bg-primary" : ""}
                onClick={() => {
                  setIsEmpty(true);
                  setTierId("");
                }}
              >
                Espacio Vacío
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seat-name">Nombre</Label>
            <Input
              id="seat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>
          
          {!isEmpty && (
            <div className="space-y-2">
              <Label htmlFor="tier">Tipo de Asiento</Label>
              <Select
                value={tierId}
                onValueChange={setTierId}
              >
                <SelectTrigger id="tier" className="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {seatTiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name} - ${tier.basePrice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {seatTiers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay tipos de asiento disponibles
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 