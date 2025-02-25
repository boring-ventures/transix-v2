import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { ScheduleStatus } from "@prisma/client";
import type { Bus } from "@/hooks/use-buses";
import type { Driver } from "@/hooks/use-drivers";
import type { Route } from "@/hooks/use-routes";

export type Schedule = {
  id: string;
  routeId: string;
  busId: string;
  routeScheduleId: string;
  primaryDriverId: string;
  secondaryDriverId?: string;
  departureDate: string;
  estimatedArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  price: number;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
  bus?: Bus;
  primaryDriver?: Driver;
  secondaryDriver?: Driver;
  routeSchedule?: {
    id: string;
    routeId: string;
    dayOfWeek: number;
    departureTime: string;
    route?: Route;
  };
  _count?: {
    tickets: number;
    parcels: number;
    busLogs: number;
    occupancyLogs: number;
  };
};

export type ScheduleFormData = {
  routeId: string;
  busId: string;
  routeScheduleId?: string;
  primaryDriverId: string;
  secondaryDriverId?: string;
  departureDate: string;
  estimatedArrivalTime: string;
  price: number;
  status?: ScheduleStatus;
};

export type ScheduleStatusUpdate = {
  status: ScheduleStatus;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
};

export type OccupancyLog = {
  id: string;
  scheduleId: string;
  passengerCount: number;
  recordedAt: string;
  notes?: string;
};

export type OccupancyLogFormData = {
  passengerCount: number;
  recordedAt?: string;
  notes?: string;
};

export type Ticket = {
  id: string;
  scheduleId: string;
  customerId?: string;
  busSeatId: string;
  price: number;
  purchasedBy?: string;
  purchasedAt: string;
  notes?: string;
  status: "active" | "cancelled";
  customer?: {
    id: string;
    fullName: string;
    documentId?: string;
  };
  busSeat?: {
    id: string;
    seatNumber: string;
    tier?: {
      id: string;
      name: string;
    };
  };
};

export type TicketFormData = {
  customerId?: string;
  busSeatId: string;
  price?: number;
  purchasedBy?: string;
  notes?: string;
};

export type Parcel = {
  id: string;
  scheduleId: string;
  trackingNumber: string;
  description?: string;
  weight?: number;
  dimensions?: string;
  senderId: string;
  receiverId: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    fullName: string;
  };
  receiver?: {
    id: string;
    fullName: string;
  };
  statusUpdates?: Array<{
    id: string;
    status: string;
    notes?: string;
    updatedAt: string;
  }>;
};

export type ParcelFormData = {
  trackingNumber: string;
  description?: string;
  weight?: number;
  dimensions?: string;
  senderId: string;
  receiverId: string;
  price?: number;
  status?: string;
};

export type PassengerListItem = {
  id: string;
  scheduleId: string;
  documentId?: string;
  fullName: string;
  seatNumber: string;
  status: "confirmed" | "cancelled" | "no_show";
};

export type ScheduleAvailability = {
  schedule: Schedule;
  availableSeats: Array<{
    id: string;
    seatNumber: string;
    tier?: {
      id: string;
      name: string;
      basePrice: number;
    };
  }>;
  seatsByTier: Record<
    string,
    Array<{
      id: string;
      seatNumber: string;
      tier?: {
        id: string;
        name: string;
        basePrice: number;
      };
    }>
  >;
  totalAvailable: number;
  totalCapacity: number;
  occupancyRate: number;
};

export type ScheduleSearchParams = {
  originId: string;
  destinationId: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
};

export function useSchedules({
  routeId,
  busId,
  status,
  primaryDriverId,
  secondaryDriverId,
  fromDate,
  toDate,
  routeScheduleId,
}: {
  routeId?: string;
  busId?: string;
  status?: ScheduleStatus;
  primaryDriverId?: string;
  secondaryDriverId?: string;
  fromDate?: string;
  toDate?: string;
  routeScheduleId?: string;
} = {}) {
  const queryClient = useQueryClient();

  // Fetch all schedules with optional filtering
  const {
    data: schedules = [],
    isLoading: isLoadingSchedules,
    error: schedulesError,
    refetch: refetchSchedules,
  } = useQuery({
    queryKey: [
      "schedules",
      {
        routeId,
        busId,
        status,
        primaryDriverId,
        secondaryDriverId,
        fromDate,
        toDate,
        routeScheduleId,
      },
    ],
    queryFn: async () => {
      let url = "/api/schedules";
      const params = new URLSearchParams();

      if (routeId) params.append("routeId", routeId);
      if (busId) params.append("busId", busId);
      if (status) params.append("status", status);
      if (primaryDriverId) params.append("primaryDriverId", primaryDriverId);
      if (secondaryDriverId)
        params.append("secondaryDriverId", secondaryDriverId);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      if (routeScheduleId) params.append("routeScheduleId", routeScheduleId);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      return response.data.schedules;
    },
  });

  // Fetch a single schedule by ID
  const fetchSchedule = useCallback(async (id: string) => {
    const response = await axios.get(`/api/schedules/${id}`);
    return response.data.schedule;
  }, []);

  // Create a new schedule
  const createSchedule = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const response = await axios.post("/api/schedules", data);
      return response.data.schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({
        title: "Éxito",
        description: "Viaje programado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al programar el viaje";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update an existing schedule
  const updateSchedule = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ScheduleFormData>;
    }) => {
      const response = await axios.patch(`/api/schedules/${id}`, data);
      return response.data.schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({
        title: "Éxito",
        description: "Viaje actualizado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar el viaje";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update schedule status
  const updateScheduleStatus = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ScheduleStatusUpdate;
    }) => {
      const response = await axios.patch(`/api/schedules/${id}/status`, data);
      return response.data.schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({
        title: "Éxito",
        description: "Estado del viaje actualizado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar el estado del viaje";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Cancel a schedule
  const cancelSchedule = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/schedules/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({
        title: "Éxito",
        description: "Viaje cancelado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al cancelar el viaje";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fetch occupancy logs for a schedule
  const fetchOccupancyLogs = useCallback(async (scheduleId: string) => {
    const response = await axios.get(`/api/schedules/${scheduleId}/occupancy`);
    return response.data.occupancyLogs;
  }, []);

  // Create an occupancy log
  const createOccupancyLog = useMutation({
    mutationFn: async ({
      scheduleId,
      data,
    }: {
      scheduleId: string;
      data: OccupancyLogFormData;
    }) => {
      const response = await axios.post(
        `/api/schedules/${scheduleId}/occupancy`,
        data
      );
      return response.data.occupancyLog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["schedules", variables.scheduleId, "occupancy"],
      });
      toast({
        title: "Éxito",
        description: "Registro de ocupación creado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear el registro de ocupación";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fetch tickets for a schedule
  const fetchTickets = useCallback(
    async (scheduleId: string, status?: string) => {
      let url = `/api/schedules/${scheduleId}/tickets`;
      if (status) url += `?status=${status}`;

      const response = await axios.get(url);
      return response.data.tickets;
    },
    []
  );

  // Create a ticket
  const createTicket = useMutation({
    mutationFn: async ({
      scheduleId,
      data,
    }: {
      scheduleId: string;
      data: TicketFormData;
    }) => {
      const response = await axios.post(
        `/api/schedules/${scheduleId}/tickets`,
        data
      );
      return response.data.ticket;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["schedules", variables.scheduleId, "tickets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["schedules", variables.scheduleId, "availability"],
      });
      toast({
        title: "Éxito",
        description: "Boleto creado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear el boleto";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fetch parcels for a schedule
  const fetchParcels = useCallback(
    async (scheduleId: string, status?: string) => {
      let url = `/api/schedules/${scheduleId}/parcels`;
      if (status) url += `?status=${status}`;

      const response = await axios.get(url);
      return response.data.parcels;
    },
    []
  );

  // Create a parcel
  const createParcel = useMutation({
    mutationFn: async ({
      scheduleId,
      data,
    }: {
      scheduleId: string;
      data: ParcelFormData;
    }) => {
      const response = await axios.post(
        `/api/schedules/${scheduleId}/parcels`,
        data
      );
      return response.data.parcel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["schedules", variables.scheduleId, "parcels"],
      });
      toast({
        title: "Éxito",
        description: "Paquete registrado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al registrar el paquete";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fetch passenger list for a schedule
  const fetchPassengerList = useCallback(
    async (scheduleId: string, status?: string) => {
      let url = `/api/schedules/${scheduleId}/passenger-list`;
      if (status) url += `?status=${status}`;

      const response = await axios.get(url);
      return response.data.passengerList;
    },
    []
  );

  // Generate passenger list from tickets
  const generatePassengerList = useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await axios.post(
        `/api/schedules/${scheduleId}/passenger-list`
      );
      return response.data;
    },
    onSuccess: (_, scheduleId) => {
      queryClient.invalidateQueries({
        queryKey: ["schedules", scheduleId, "passenger-list"],
      });
      toast({
        title: "Éxito",
        description: "Lista de pasajeros generada exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al generar la lista de pasajeros";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fetch schedule availability
  const fetchScheduleAvailability = useCallback(async (scheduleId: string) => {
    const response = await axios.get(
      `/api/schedules/availability?scheduleId=${scheduleId}`
    );
    return response.data as ScheduleAvailability;
  }, []);

  // Search schedules
  const searchSchedules = useCallback(async (params: ScheduleSearchParams) => {
    const searchParams = new URLSearchParams();
    searchParams.append("originId", params.originId);
    searchParams.append("destinationId", params.destinationId);
    searchParams.append("departureDate", params.departureDate);

    if (params.returnDate) searchParams.append("returnDate", params.returnDate);
    if (params.passengers)
      searchParams.append("passengers", params.passengers.toString());

    const response = await axios.get(
      `/api/schedules/search?${searchParams.toString()}`
    );
    return response.data;
  }, []);

  return {
    schedules,
    isLoadingSchedules,
    schedulesError,
    refetchSchedules,
    fetchSchedule,
    createSchedule,
    updateSchedule,
    updateScheduleStatus,
    cancelSchedule,
    fetchOccupancyLogs,
    createOccupancyLog,
    fetchTickets,
    createTicket,
    fetchParcels,
    createParcel,
    fetchPassengerList,
    generatePassengerList,
    fetchScheduleAvailability,
    searchSchedules,
    isCreating: createSchedule.isPending,
    isUpdating: updateSchedule.isPending,
    isUpdatingStatus: updateScheduleStatus.isPending,
    isCancelling: cancelSchedule.isPending,
    isCreatingOccupancyLog: createOccupancyLog.isPending,
    isCreatingTicket: createTicket.isPending,
    isCreatingParcel: createParcel.isPending,
    isGeneratingPassengerList: generatePassengerList.isPending,
  };
}
