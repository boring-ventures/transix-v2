import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
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
}

interface UseTicketsProps {
  scheduleId?: string;
  customerId?: string;
  status?: TicketStatus;
  purchasedBy?: string;
}

export function useTickets(props?: UseTicketsProps) {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      if (props?.scheduleId) params.append("scheduleId", props.scheduleId);
      if (props?.customerId) params.append("customerId", props.customerId);
      if (props?.status) params.append("status", props.status);
      if (props?.purchasedBy) params.append("purchasedBy", props.purchasedBy);
      
      const response = await fetch(`/api/tickets?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tickets");
      }
      
      const data = await response.json();
      setTickets(data.tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast({
        title: "Error",
        description: "Ha ocurrido un error al cargar los tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [props?.scheduleId, props?.customerId, props?.status, props?.purchasedBy,]);

  const createTicket = useCallback(async (ticketData: {
    scheduleId: string;
    customerId?: string;
    busSeatId: string;
    price: number;
    purchasedBy?: string;
    notes?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create ticket");
      }
      
      const data = await response.json();
      setTickets(prev => [data.ticket, ...prev]);
      toast({
        title: "Ticket creado",
        description: "Ticket creado exitosamente",
      });
      return data.ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast({
        title: "Error",
        description: "Ha ocurrido un error al crear el ticket",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTicket = useCallback(async (
    ticketId: string,
    updateData: {
      customerId?: string;
      notes?: string;
      status?: TicketStatus;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
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
      
      // Update the ticket in the local state
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? data.ticket : ticket
        )
      );
      
      toast({
        title: "Ticket actualizado",
        description: "Ticket actualizado exitosamente",
      });
      return data.ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast({
        title: "Error",
        description: "Ha ocurrido un error al actualizar el ticket",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelTicket = useCallback(async (ticketId: string, reason: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}/cancel`, {
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
      
      // Update the ticket in the local state
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status: "cancelled" as TicketStatus } : ticket
        )
      );
      
      toast({
        title: "Ticket cancelado",
        description: "Ticket cancelado exitosamente",
      });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast({
        title: "Error",
        description: "Ha ocurrido un error al cancelar el ticket",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    tickets,
    isLoading,
    error,
    fetchTickets,
    createTicket,
    updateTicket,
    cancelTicket,
  };
} 