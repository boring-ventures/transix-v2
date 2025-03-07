import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { MaintenanceStatus } from "@prisma/client";
import type { Company } from "@/hooks/use-companies";
import type { BusTemplate, SeatMatrix } from "@/hooks/use-bus-templates";
import type { BusSeat } from "@/hooks/use-bus-seats";

export type Bus = {
  id: string;
  companyId: string;
  templateId: string;
  plateNumber: string;
  isActive: boolean;
  seatMatrix: SeatMatrix;
  maintenanceStatus: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  template?: BusTemplate;
  busSeats?: BusSeat[];
  _count?: {
    assignments: number;
    busSeats: number;
    schedules: number;
  };
};

export type BusFormData = {
  companyId: string;
  templateId: string;
  plateNumber: string;
  isActive?: boolean;
  seatMatrix?: SeatMatrix;
  maintenanceStatus?: MaintenanceStatus;
};

export function useBuses(isActive?: boolean) {
  const queryClient = useQueryClient();

  // Fetch all buses (optionally filtered by company and template)
  const {
    data: buses = [],
    isLoading: isLoadingBuses,
    error: busesError,
    refetch: refetchBuses,
  } = useQuery({
    queryKey: ["buses", { isActive }],
    queryFn: async () => {
      let url = "/api/buses";
      const params = new URLSearchParams();

      // Only add isActive param if it's explicitly defined (not undefined)
      if (isActive !== undefined) {
        params.append("isActive", String(isActive));
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("Fetching buses with URL:", url);
      const response = await axios.get(url);
      console.log("Buses response:", response.data);
      return response.data.buses || [];
    },
  });

  // Fetch a single bus by ID
  const fetchBus = useCallback(async (id: string) => {
    try {
      console.log("Fetching bus with ID:", id);
      const response = await axios.get(`/api/buses/${id}`);
      console.log("Bus data received:", response.data);
      return response.data.bus;
    } catch (error) {
      console.error("Error fetching bus:", error);
      throw error;
    }
  }, []);

  // Create a new bus
  const createBus = useMutation({
    mutationFn: async (data: BusFormData) => {
      const response = await axios.post("/api/buses", data);
      return response.data.bus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast({
        title: "Éxito",
        description: "Bus creado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear el bus";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update an existing bus
  const updateBus = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BusFormData>;
    }) => {
      const response = await axios.patch(`/api/buses/${id}`, data);
      return response.data.bus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast({
        title: "Éxito",
        description: "Bus actualizado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar el bus";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete a bus
  const deleteBus = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/buses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast({
        title: "Éxito",
        description: "Bus eliminado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al eliminar el bus";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update maintenance status
  const updateMaintenanceStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: MaintenanceStatus;
    }) => {
      const response = await axios.patch(`/api/buses/${id}/maintenance`, {
        status,
      });
      return response.data.bus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast({
        title: "Éxito",
        description: "Estado de mantenimiento actualizado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar el estado de mantenimiento";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Create or update bus seats
  const updateBusSeats = useMutation({
    mutationFn: async ({
      busId,
      seats,
    }: {
      busId: string;
      seats: Array<BusSeat>;
    }) => {
      const response = await axios.post(`/api/buses/${busId}/seats`, { seats });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
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

  // Search buses
  const searchBuses = useCallback(
    async (query: string, options?: { companyId?: string; limit?: number }) => {
      const params = new URLSearchParams();
      params.append("q", query);

      if (options?.companyId) params.append("companyId", options.companyId);
      if (options?.limit) params.append("limit", options.limit.toString());

      const response = await axios.get(
        `/api/buses/search?${params.toString()}`
      );
      return response.data.buses;
    },
    []
  );

  return {
    buses,
    isLoadingBuses,
    busesError,
    refetchBuses,
    fetchBus,
    createBus,
    updateBus,
    deleteBus,
    updateMaintenanceStatus,
    updateBusSeats,
    searchBuses,
    isCreating: createBus.isPending,
    isUpdating: updateBus.isPending,
    isDeleting: deleteBus.isPending,
    isUpdatingMaintenance: updateMaintenanceStatus.isPending,
    isUpdatingSeats: updateBusSeats.isPending,
  };
}
