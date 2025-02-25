"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
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
  
  const handleSave = () => {
    onUpdate({
      ...seat,
      isEmpty,
      tierId: isEmpty ? "" : tierId,
    });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Asiento {seat.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="is-empty" className="text-right">
              Espacio vacío
            </Label>
            <Switch
              id="is-empty"
              checked={isEmpty}
              onCheckedChange={setIsEmpty}
            />
          </div>
          
          {!isEmpty && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tier" className="text-right col-span-1">
                Tipo de asiento
              </Label>
              <Select
                value={tierId}
                onValueChange={setTierId}
                disabled={isEmpty}
                className="col-span-3"
              >
                <SelectTrigger id="tier">
                  <SelectValue placeholder="Seleccionar tipo" />
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
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 