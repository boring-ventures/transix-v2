import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { Ticket, TicketStatus } from "@prisma/client";

interface TicketWithRelations extends Ticket {
  schedule: {
    id: string;
    departureDate: Date;
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
  cancellations?: Array<{
    id: string;
    reason: string;
    cancelledAt: Date;
  }>;
  reassignments?: Array<{
    id: string;
    reason: string;
    reassignedAt: Date;
    oldSchedule: {
      id: string;
      departureDate: Date;
    };
    newSchedule: {
      id: string;
      departureDate: Date;
    };
  }>;
}

export function useTicket(ticketId?: string) {
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tickets/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch ticket");
      }
      
      const data = await response.json();
      setTicket(data.ticket);
      return data.ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error("Failed to load ticket details");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTicket = useCallback(async (
    id: string,
    updateData: {
      customerId?: string;
      notes?: string;
      status?: TicketStatus;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update ticket");
      }
      
      const data = await response.json();
      setTicket(data.ticket);
      toast.success("Ticket updated successfully");
      return data.ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to update ticket");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelTicket = useCallback(async (id: string, reason: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tickets/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel ticket");
      }
      
      const data = await response.json();
      
      // Update the local ticket state
      if (ticket) {
        setTicket({
          ...ticket,
          status: "cancelled" as TicketStatus,
          cancellations: [
            ...(ticket.cancellations || []),
            data.cancellation,
          ],
        });
      }
      
      toast.success("Ticket cancelled successfully");
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to cancel ticket");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ticket]);

  const reassignTicket = useCallback(async (
    id: string,
    reassignData: {
      newScheduleId: string;
      newBusSeatId: string;
      reason: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tickets/${id}/reassign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reassignData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reassign ticket");
      }
      
      const data = await response.json();
      
      // Fetch the updated ticket to get all the relations
      await fetchTicket(id);
      
      toast.success("Ticket reassigned successfully");
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to reassign ticket");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTicket]);

  // Fetch ticket on mount if ticketId is provided
  useEffect(() => {
    if (ticketId) {
      fetchTicket(ticketId);
    }
  }, [ticketId, fetchTicket]);

  return {
    ticket,
    isLoading,
    error,
    fetchTicket,
    updateTicket,
    cancelTicket,
    reassignTicket,
  };
} 