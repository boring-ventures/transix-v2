import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";

export type Location = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    originRoutes: number;
    destinationRoutes: number;
  };
};

export type LocationStats = {
  totalRoutesCount: number;
  originRoutesCount: number;
  destinationRoutesCount: number;
  activeRoutesCount: number;
  schedulesCount: number;
};

export type LocationFormData = {
  name: string;
  active?: boolean;
};

export function useLocations(fetchInactive = false) {
  const queryClient = useQueryClient();

  // Fetch all locations
  const {
    data: locations = [],
    isLoading: isLoadingLocations,
    error: locationsError,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: ["locations", { fetchInactive }],
    queryFn: async () => {
      let url = "/api/locations";
      const params = new URLSearchParams();
      
      if (!fetchInactive) params.append("active", "true");
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data.locations;
    },
  });

  // Fetch a single location by ID
  const fetchLocation = useCallback(async (id: string) => {
    const response = await axios.get(`/api/locations/${id}`);
    return response.data.location;
  }, []);

  // Fetch location stats
  const fetchLocationStats = useCallback(async (id: string) => {
    const response = await axios.get(`/api/locations/${id}/stats`);
    return response.data.stats;
  }, []);

  // Create a new location
  const createLocation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      const response = await axios.post("/api/locations", data);
      return response.data.location;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({
        title: "Éxito",
        description: "Ubicación creada exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al crear la ubicación",
        variant: "destructive",
      });
    },
  });

  // Update an existing location
  const updateLocation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LocationFormData }) => {
      const response = await axios.patch(`/api/locations/${id}`, data);
      return response.data.location;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({
        title: "Éxito",
        description: "Ubicación actualizada exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al actualizar la ubicación",
        variant: "destructive",
      });
    },
  });

  // Deactivate a location
  const deactivateLocation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.patch(`/api/locations/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({
        title: "Éxito",
        description: "Ubicación desactivada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al desactivar la ubicación",
        variant: "destructive",
      });
    },
  });

  // Delete a location
  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/locations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({
        title: "Éxito",
        description: "Ubicación eliminada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar la ubicación",
        variant: "destructive",
      });
    },
  });

  // Search locations
  const searchLocations = useCallback(async (query: string, options?: { type?: string; limit?: number }) => {
    const params = new URLSearchParams();
    params.append("q", query);
    
    if (options?.type) params.append("type", options.type);
    if (options?.limit) params.append("limit", options.limit.toString());
    
    const response = await axios.get(`/api/locations/search?${params.toString()}`);
    return response.data.locations;
  }, []);

  return {
    locations,
    isLoadingLocations,
    locationsError,
    refetchLocations,
    fetchLocation,
    fetchLocationStats,
    createLocation,
    updateLocation,
    deactivateLocation,
    deleteLocation,
    searchLocations,
    isCreating: createLocation.isPending,
    isUpdating: updateLocation.isPending,
    isDeactivating: deactivateLocation.isPending,
    isDeleting: deleteLocation.isPending,
  };
} 