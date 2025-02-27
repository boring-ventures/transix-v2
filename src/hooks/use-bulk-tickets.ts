import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Ticket } from "@prisma/client";

interface BulkTicketData {
  scheduleId: string;
  busSeatId: string;
  customerId?: string;
  price: number;
  notes?: string;
}

export function useBulkTickets() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBulkTickets = useCallback(async (
    tickets: BulkTicketData[],
    purchasedBy?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/tickets/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tickets, purchasedBy }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create tickets");
      }
      
      const data = await response.json();
      toast.success(`${data.tickets.length} tickets created successfully`);
      return data.tickets;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to create tickets");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createBulkTickets,
  };
} 