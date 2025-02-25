import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";

export type Driver = {
  id: string;
  fullName: string;
  documentId: string;
  licenseNumber: string;
  licenseCategory: string;
  companyId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  _count?: {
    primarySchedules: number;
    secondarySchedules: number;
  };
};

export type DriverStats = {
  totalTrips: number;
  primaryDriverTrips: number;
  secondaryDriverTrips: number;
  scheduledTrips: number;
  completedTrips: number;
  inProgressTrips: number;
  upcomingSchedules: Array<{
    id: string;
    departureDate: string;
    routeSchedule?: {
      route?: {
        origin?: { name: string };
        destination?: { name: string };
      };
    };
    bus?: { plateNumber: string };
  }>;
};



export type DriverFormData = {
  fullName: string;
  documentId: string;
  licenseNumber: string;
  licenseCategory: string;
  companyId: string;
  active?: boolean;
};

export function useDrivers(fetchInactive = false) {
  const queryClient = useQueryClient();

  // Fetch all drivers (active by default)
  const {
    data: drivers = [],
    isLoading: isLoadingDrivers,
    error: driversError,
    refetch: refetchDrivers,
  } = useQuery({
    queryKey: ["drivers", { fetchInactive }],
    queryFn: async () => {
      const response = await axios.get(
        `/api/drivers${fetchInactive ? "?includeInactive=true" : "?active=true"}`
      );
      return response.data.drivers;
    },
  });

  // Fetch a single driver by ID
  const fetchDriver = useCallback(async (id: string) => {
    const response = await axios.get(`/api/drivers/${id}`);
    return response.data.driver;
  }, []);

  // Fetch driver statistics
  const fetchDriverStats = useCallback(async (id: string) => {
    const response = await axios.get(`/api/drivers/${id}/stats`);
    return response.data.stats;
  }, []);

  // Create a new driver
  const createDriver = useMutation({
    mutationFn: async (data: DriverFormData) => {
      const response = await axios.post("/api/drivers", data);
      return response.data.driver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Éxito",
        description: "Conductor creado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear el conductor";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update an existing driver
  const updateDriver = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DriverFormData }) => {
      const response = await axios.patch(`/api/drivers/${id}`, data);
      return response.data.driver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Éxito",
        description: "Conductor actualizado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar el conductor";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Soft delete a driver (set active to false)
  const deleteDriver = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/drivers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Éxito",
        description: "Conductor desactivado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al desactivar el conductor";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Assign company to driver
  const assignCompany = useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const response = await axios.post(`/api/drivers/${id}/assign-company`, { companyId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Éxito",
        description: "Empresa asignada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al asignar empresa";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Search drivers
  const searchDrivers = useCallback(async (query: string, companyId?: string) => {
    const url = new URL("/api/drivers/search", window.location.origin);
    url.searchParams.append("q", query);
    if (companyId) url.searchParams.append("companyId", companyId);
    
    const response = await axios.get(url.toString());
    return response.data.drivers;
  }, []);

  return {
    drivers,
    isLoadingDrivers,
    driversError,
    refetchDrivers,
    fetchDriver,
    fetchDriverStats,
    createDriver,
    updateDriver,
    deleteDriver,
    assignCompany,
    searchDrivers,
    isCreating: createDriver.isPending,
    isUpdating: updateDriver.isPending,
    isDeleting: deleteDriver.isPending,
    isAssigningCompany: assignCompany.isPending,
  };
} 