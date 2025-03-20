import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import type { TicketStatus } from "@prisma/client";
import { useCompanyFilter } from "./use-company-filter";

export interface TicketWithRelations {
  id: string;
  scheduleId: string;
  busSeatId: string;
  customerId: string | null;
  price: number;
  purchasedAt: string;
  purchasedBy: string | null;
  status: TicketStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  schedule: {
    id: string;
    departureDate: string;
    routeSchedule: {
      route: {
        origin: {
          name: string;
        };
        destination: {
          name: string;
        };
      };
    };
    bus?: {
      plateNumber: string;
    };
  };
  customer?: {
    id: string;
    fullName: string;
  } | null;
  busSeat: {
    id: string;
    seatNumber: string;
    tier: {
      name: string;
    };
  };
  profile?: {
    id: string;
    fullName: string;
  } | null;
  paymentLines?: Array<{
    id: string;
    amount: number;
    payment: {
      method: string;
      reference: string;
    };
  }>;
}

export interface TicketFormData {
  scheduleId: string;
  customerId?: string;
  busSeatId: string;
  price: number;
  purchasedBy?: string;
  notes?: string;
  companyId?: string;
}

export function useTicketsQuery({
  scheduleId,
  customerId,
  status,
  purchasedBy,
  fromDate,
  toDate,
}: {
  scheduleId?: string;
  customerId?: string;
  status?: TicketStatus;
  purchasedBy?: string;
  fromDate?: string;
  toDate?: string;
} = {}) {
  const queryClient = useQueryClient();
  const { companyId: userCompanyId, isCompanyRestricted } = useCompanyFilter();

  // Fetch tickets with optional filtering
  const {
    data: tickets = [],
    isLoading,
    error,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: [
      "tickets",
      {
        scheduleId,
        customerId,
        status,
        purchasedBy,
        fromDate,
        toDate,
        userCompanyId,
      },
    ],
    queryFn: async () => {
      let url = "/api/tickets";
      const params = new URLSearchParams();

      if (scheduleId) params.append("scheduleId", scheduleId);
      if (customerId) params.append("customerId", customerId);
      if (status) params.append("status", status);
      if (purchasedBy) params.append("purchasedBy", purchasedBy);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      // If user is company_admin, branch_admin or seller, automatically filter by their company
      if (userCompanyId) {
        params.append("companyId", userCompanyId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      return response.data.tickets || [];
    },
  });

  // Fetch a single ticket by ID
  const fetchTicket = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`/api/tickets/${id}`);
      return response.data.ticket;
    } catch (error) {
      console.error("Error fetching ticket:", error);
      throw error;
    }
  }, []);

  // Create a new ticket
  const createTicket = useMutation({
    mutationFn: async (data: TicketFormData) => {
      // If user is restricted to a company, enforce their company ID
      const finalData = isCompanyRestricted
        ? { ...data, companyId: userCompanyId }
        : data;

      const response = await axios.post("/api/tickets", finalData);
      return response.data.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({
        title: "Éxito",
        description: "Ticket creado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al crear el ticket";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update a ticket
  const updateTicket = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TicketFormData>;
    }) => {
      const response = await axios.patch(`/api/tickets/${id}`, data);
      return response.data.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({
        title: "Éxito",
        description: "Ticket actualizado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al actualizar el ticket";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Cancel a ticket
  const cancelTicket = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await axios.post(`/api/tickets/${id}/cancel`, {
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({
        title: "Éxito",
        description: "Ticket cancelado exitosamente",
      });
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Error al cancelar el ticket";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    tickets,
    isLoading,
    error,
    refetchTickets,
    fetchTicket,
    createTicket,
    updateTicket,
    cancelTicket,
    isCreating: createTicket.isPending,
    isUpdating: updateTicket.isPending,
    isCancelling: cancelTicket.isPending,
    userCompanyId,
    isCompanyRestricted,
  };
}
