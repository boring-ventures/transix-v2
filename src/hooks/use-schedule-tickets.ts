import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { Ticket } from "@prisma/client";

interface TicketWithRelations extends Ticket {
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

interface TicketStats {
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  occupancyRate: number;
}

export function useScheduleTickets(scheduleId?: string) {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/schedules/${id}/tickets`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch schedule tickets");
      }
      
      const data = await response.json();
      setTickets(data.tickets);
      setStats(data.stats);
      return { tickets: data.tickets, stats: data.stats };
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error("Failed to load schedule tickets");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (
    id: string,
    ticketData: {
      customerId?: string;
      busSeatId: string;
      price?: number;
      purchasedBy?: string;
      notes?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/schedules/${id}/tickets`, {
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
      
      // Update local state
      setTickets(prev => [data.ticket, ...prev]);
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          occupiedSeats: stats.occupiedSeats + 1,
          availableSeats: stats.availableSeats - 1,
          occupancyRate: ((stats.occupiedSeats + 1) / stats.totalSeats) * 100,
        });
      }
      
      toast.success("Ticket created successfully");
      return data.ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [stats]);

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
          ticket.id === ticketId ? { ...ticket, status: "cancelled" } : ticket
        )
      );
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          occupiedSeats: stats.occupiedSeats - 1,
          availableSeats: stats.availableSeats + 1,
          occupancyRate: ((stats.occupiedSeats - 1) / stats.totalSeats) * 100,
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
  }, [stats]);

  // Fetch tickets on mount if scheduleId is provided
  useEffect(() => {
    if (scheduleId) {
      fetchTickets(scheduleId);
    }
  }, [scheduleId, fetchTickets]);

  return {
    tickets,
    stats,
    isLoading,
    error,
    fetchTickets,
    createTicket,
    cancelTicket,
  };
} 