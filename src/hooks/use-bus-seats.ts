import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { SeatStatus } from "@prisma/client";
import type { SeatTier } from "@/hooks/use-seat-tiers";

export type BusSeat = {
  id: string;
  busId: string;
  seatNumber: string;
  tierId: string;
  status: SeatStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tier?: SeatTier;
};

export type MatrixSeat = {
  id: string;
  name: string;
  row: number;
  column: number;
  isEmpty: boolean;
  tierId?: string;
}

export type BusSeatFormData = {
  busId: string;
  seatNumber: string;
  tierId: string;
  status?: SeatStatus;
  isActive?: boolean;
};

export type BulkSeatCreate = {
  busId: string;
  seats: Array<{
    seatNumber: string;
    tierId: string;
    status?: SeatStatus;
    isActive?: boolean;
  }>;
};

export type BulkSeatUpdate = {
  updates: Array<{
    id: string;
    tierId?: string;
    status?: SeatStatus;
    isActive?: boolean;
  }>;
};

export function useBusSeats(busId?: string) {
  const queryClient = useQueryClient();

  // Fetch all seats for a specific bus
  const {
    data: seats = [],
    isLoading: isLoadingSeats,
    error: seatsError,
    refetch: refetchSeats,
  } = useQuery({
    queryKey: ["busSeats", busId],
    queryFn: async () => {
      if (!busId) return [];
      
      const response = await axios.get(`/api/buses/${busId}/seats`);
      return response.data.seats;
    },
    enabled: !!busId,
  });

  // Fetch a single bus seat by ID
  const fetchSeat = useCallback(async (id: string) => {
    const response = await axios.get(`/api/bus-seats/${id}`);
    return response.data.busSeat;
  }, []);

  // Create a new bus seat
  const createSeat = useMutation({
    mutationFn: async (data: BusSeatFormData) => {
      const response = await axios.post("/api/bus-seats", data);
      return response.data.busSeat;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["busSeats", variables.busId] });
      toast({
        title: "Éxito",
        description: "Asiento creado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear el asiento";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update an existing bus seat
  const updateSeat = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<BusSeatFormData, "busId" | "seatNumber">>;
    }) => {
      const response = await axios.patch(`/api/bus-seats/${id}`, data);
      return response.data.busSeat;
    },
    onSuccess: () => {
      // We need to get the busId from the seat to invalidate the correct query
      queryClient.invalidateQueries({ queryKey: ["busSeats"] });
      toast({
        title: "Éxito",
        description: "Asiento actualizado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar el asiento";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete a bus seat
  const deleteSeat = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/bus-seats/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busSeats"] });
      toast({
        title: "Éxito",
        description: "Asiento eliminado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al eliminar el asiento";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Bulk create bus seats
  const bulkCreateSeats = useMutation({
    mutationFn: async (data: BulkSeatCreate) => {
      const response = await axios.post("/api/bus-seats/bulk", data);
      return response.data.busSeats;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["busSeats", variables.busId] });
      toast({
        title: "Éxito",
        description: "Asientos creados exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear los asientos";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Bulk update bus seats
  const bulkUpdateSeats = useMutation({
    mutationFn: async (data: BulkSeatUpdate) => {
      const response = await axios.patch("/api/bus-seats/bulk", data);
      return response.data.busSeats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busSeats"] });
      toast({
        title: "Éxito",
        description: "Asientos actualizados exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar los asientos";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Create or update all seats for a bus
  const updateBusSeats = useMutation({
    mutationFn: async (data: BulkSeatCreate) => {
      const response = await axios.post(`/api/buses/${data.busId}/seats`, { seats: data.seats });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["busSeats", variables.busId] });
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast({
        title: "Éxito",
        description: "Asientos actualizados exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar los asientos";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    seats,
    isLoadingSeats,
    seatsError,
    refetchSeats,
    fetchSeat,
    createSeat,
    updateSeat,
    deleteSeat,
    bulkCreateSeats,
    bulkUpdateSeats,
    updateBusSeats,
    isCreating: createSeat.isPending,
    isUpdating: updateSeat.isPending,
    isDeleting: deleteSeat.isPending,
    isBulkCreating: bulkCreateSeats.isPending,
    isBulkUpdating: bulkUpdateSeats.isPending,
    isUpdatingSeats: updateBusSeats.isPending,
  };
} 