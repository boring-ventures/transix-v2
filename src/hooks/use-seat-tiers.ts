import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { Company } from "@/hooks/use-companies";

export type SeatTier = {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  _count?: {
    busSeats: number;
  };
};

export type SeatTierFormData = {
  name: string;
  description?: string;
  companyId: string;
  basePrice: number;
  isActive?: boolean;
};

export function useSeatTiers(companyId?: string, fetchInactive = false) {
  const queryClient = useQueryClient();

  // Fetch all seat tiers (optionally filtered by company)
  const {
    data: seatTiers = [],
    isLoading: isLoadingSeatTiers,
    error: seatTiersError,
    refetch: refetchSeatTiers,
  } = useQuery({
    queryKey: ["seatTiers", { companyId, fetchInactive }],
    queryFn: async () => {
      let url = "/api/seat-tiers";
      const params = new URLSearchParams();
      
      if (companyId) params.append("companyId", companyId);
      if (!fetchInactive) params.append("isActive", "true");
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data.seatTiers;
    },
    enabled: !!companyId || companyId === undefined, // Only fetch if companyId is provided or explicitly undefined
  });

  // Fetch a single seat tier by ID
  const fetchSeatTier = useCallback(async (id: string) => {
    const response = await axios.get(`/api/seat-tiers/${id}`);
    return response.data.seatTier;
  }, []);

  // Create a new seat tier
  const createSeatTier = useMutation({
    mutationFn: async (data: SeatTierFormData) => {
      const response = await axios.post("/api/seat-tiers", data);
      return response.data.seatTier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seatTiers"] });
      toast({
        title: "Éxito",
        description: "Categoría de asiento creada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear la categoría de asiento";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update an existing seat tier
  const updateSeatTier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SeatTierFormData> }) => {
      const response = await axios.patch(`/api/seat-tiers/${id}`, data);
      return response.data.seatTier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seatTiers"] });
      toast({
        title: "Éxito",
        description: "Categoría de asiento actualizada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar la categoría de asiento";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete a seat tier
  const deleteSeatTier = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/seat-tiers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seatTiers"] });
      toast({
        title: "Éxito",
        description: "Categoría de asiento eliminada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al eliminar la categoría de asiento";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Search seat tiers
  const searchSeatTiers = useCallback(async (query: string, options?: { companyId?: string; limit?: number }) => {
    const params = new URLSearchParams();
    params.append("q", query);
    
    if (options?.companyId) params.append("companyId", options.companyId);
    if (options?.limit) params.append("limit", options.limit.toString());
    
    const response = await axios.get(`/api/seat-tiers/search?${params.toString()}`);
    return response.data.seatTiers;
  }, []);

  return {
    seatTiers,
    isLoadingSeatTiers,
    seatTiersError,
    refetchSeatTiers,
    fetchSeatTier,
    createSeatTier,
    updateSeatTier,
    deleteSeatTier,
    searchSeatTiers,
    isCreating: createSeatTier.isPending,
    isUpdating: updateSeatTier.isPending,
    isDeleting: deleteSeatTier.isPending,
  };
} 