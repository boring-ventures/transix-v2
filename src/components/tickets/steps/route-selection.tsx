"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "../ticket-sales-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations, type Location } from "@/hooks/use-locations";

interface RouteSelectionProps {
  form: UseFormReturn<FormData>;
}

export function RouteSelection({ form }: RouteSelectionProps) {
  const { locations } = useLocations();

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <FormField
        control={form.control}
        name="originId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Origen</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione origen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {locations.map((location: Location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="destinationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Destino</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione destino" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {locations.map((location: Location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
