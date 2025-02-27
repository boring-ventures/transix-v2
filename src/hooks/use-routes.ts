import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { Location } from "@/hooks/use-locations";

export type Route = {
  id: string;
  name: string;
  originId: string;
  destinationId: string;
  estimatedDuration: number;
  departureLane: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  origin?: Location;
  destination?: Location;
  originLocation?: { id: string; name: string };
  destinationLocation?: { id: string; name: string };
  _count?: {
    assignments: number;
    routeSchedules: number;
  };
};

export type RouteStats = {
  assignmentsCount: number;
  activeAssignmentsCount: number;
  routeSchedulesCount: number;
  activeRouteSchedulesCount: number;
  schedulesCount: number;
  completedSchedulesCount: number;
  cancelledSchedulesCount: number;
};

export type RouteFormData = {
  name: string;
  originId: string;
  destinationId: string;
  estimatedDuration: number;
  departureLane?: string;
  active?: boolean;
};

export function useRoutes(fetchInactive = false) {
  const queryClient = useQueryClient();

  // Fetch all routes
  const {
    data: routes = [],
    isLoading,
    error: routesError,
    refetch: refetchRoutes,
  } = useQuery({
    queryKey: ["routes", { fetchInactive }],
    queryFn: async () => {
      let url = "/api/routes";
      const params = new URLSearchParams();

      if (!fetchInactive) params.append("active", "true");
      params.append("include", "originLocation,destinationLocation");

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      return response.data.routes;
    },
  });

  // Fetch a single route by ID
  const fetchRoute = useCallback(async (id: string) => {
    const response = await axios.get(`/api/routes/${id}`);
    return response.data.route;
  }, []);

  // Fetch route stats
  const fetchRouteStats = useCallback(async (id: string) => {
    const response = await axios.get(`/api/routes/${id}/stats`);
    return response.data.stats;
  }, []);

  // Create a new route
  const createRoute = useMutation({
    mutationFn: async (data: RouteFormData) => {
      const response = await axios.post("/api/routes", data);
      return response.data.route;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({
        title: "Éxito",
        description: "Ruta creada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear la ruta";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update an existing route
  const updateRoute = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RouteFormData }) => {
      const response = await axios.patch(`/api/routes/${id}`, data);
      return response.data.route;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({
        title: "Éxito",
        description: "Ruta actualizada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Error al actualizar la ruta";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Deactivate a route
  const deactivateRoute = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.patch(`/api/routes/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({
        title: "Éxito",
        description: "Ruta desactivada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Error al desactivar la ruta";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete a route
  const deleteRoute = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/routes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({
        title: "Éxito",
        description: "Ruta eliminada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Error al eliminar la ruta";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Search routes
  const searchRoutes = useCallback(
    async (
      query: string,
      options?: { originId?: string; destinationId?: string; limit?: number }
    ) => {
      const params = new URLSearchParams();

      if (query) params.append("q", query);
      if (options?.originId) params.append("originId", options.originId);
      if (options?.destinationId)
        params.append("destinationId", options.destinationId);
      if (options?.limit) params.append("limit", options.limit.toString());

      const response = await axios.get(
        `/api/routes/search?${params.toString()}`
      );
      return response.data.routes;
    },
    []
  );

  return {
    routes,
    isLoading,
    routesError,
    refetchRoutes,
    fetchRoute,
    fetchRouteStats,
    createRoute,
    updateRoute,
    deactivateRoute,
    deleteRoute,
    searchRoutes,
    isCreating: createRoute.isPending,
    isUpdating: updateRoute.isPending,
    isDeactivating: deactivateRoute.isPending,
    isDeleting: deleteRoute.isPending,
  };
} 