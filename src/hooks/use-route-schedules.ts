import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { Route } from "@/hooks/use-routes";

export type RouteSchedule = {
  id: string;
  routeId: string;
  departureTime: string;
  operatingDays: string;
  active: boolean;
  seasonStart?: string;
  seasonEnd?: string;
  estimatedArrivalTime: string;
  createdAt: string;
  updatedAt: string;
  route?: Route;
};

export type RouteScheduleFormData = {
  routeId: string;
  operatingDays: string;
  departureTime: string;
  estimatedArrivalTime: string;
  seasonStart?: Date;
  seasonEnd?: Date;
  active?: boolean;
};

export function useRouteSchedules({
  routeId,
  active,
}: {
  routeId?: string;
  active?: boolean;
} = {}) {
  const queryClient = useQueryClient();

  // Fetch all route schedules with optional filtering
  const {
    data: routeSchedules = [],
    isLoading: isLoadingRouteSchedules,
    error: routeSchedulesError,
    refetch: refetchRouteSchedules,
  } = useQuery({
    queryKey: ["routeSchedules", { routeId, active }],
    queryFn: async () => {
      let url = "/api/route-schedules";
      const params = new URLSearchParams();

      if (routeId) params.append("routeId", routeId);
      if (active !== undefined) params.append("active", active.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      return response.data.routeSchedules;
    },
  });

  // Create a new route schedule
  const createRouteSchedule = useMutation({
    mutationFn: async (data: RouteScheduleFormData) => {
      const response = await axios.post("/api/route-schedules", data);
      return response.data.routeSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeSchedules"] });
      toast({
        title: "Éxito",
        description: "Horario de ruta creado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear el horario de ruta";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update an existing route schedule
  const updateRouteSchedule = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<RouteScheduleFormData>;
    }) => {
      const response = await axios.patch(`/api/route-schedules/${id}`, data);
      return response.data.routeSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeSchedules"] });
      toast({
        title: "Éxito",
        description: "Horario de ruta actualizado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar el horario de ruta";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete a route schedule
  const deleteRouteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/route-schedules/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeSchedules"] });
      toast({
        title: "Éxito",
        description: "Horario de ruta eliminado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al eliminar el horario de ruta";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    routeSchedules,
    isLoadingRouteSchedules,
    routeSchedulesError,
    refetchRouteSchedules,
    createRouteSchedule,
    updateRouteSchedule,
    deleteRouteSchedule,
    isCreating: createRouteSchedule.isPending,
    isUpdating: updateRouteSchedule.isPending,
    isDeleting: deleteRouteSchedule.isPending,
  };
} 